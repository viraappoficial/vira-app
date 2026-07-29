import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// Brasil não usa mais horário de verão (desde 2019) — fuso fixo -03:00.
const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;
const JANELA_MIN = 15; // não notifica tarefas com horário passado há mais que isso (ex: cron ficou fora do ar)
const HORAS_ANDAMENTO_PARADO = 3;

function agoraBrasil() {
  return new Date(Date.now() - OFFSET_BRASIL_MS);
}

function paraHHMM(date: Date) {
  return date.toISOString().slice(11, 16);
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  webpush.setVapidDetails(
    'mailto:contato@vira.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const agora = agoraBrasil();
  const hoje = agora.toISOString().slice(0, 10);
  const horaAtual = paraHHMM(agora);
  const horaMinima = paraHHMM(new Date(agora.getTime() - JANELA_MIN * 60 * 1000));

  // Atalhos marcados como recorrentes: cria a tarefa do dia se ainda não existir uma
  // vinda desse mesmo atalho pra hoje (evita duplicar se o cron rodar mais de uma vez).
  const { data: modelosRecorrentes } = await supabase
    .from('modelos')
    .select('id, usuario_id, titulo_padrao, espaco_id, hora_padrao')
    .eq('recorrencia', 'diaria');

  if (modelosRecorrentes && modelosRecorrentes.length > 0) {
    const { data: tarefasDeHojeDeModelos } = await supabase
      .from('tarefas')
      .select('origem_modelo_id')
      .eq('data_prevista', hoje)
      .in(
        'origem_modelo_id',
        modelosRecorrentes.map((m) => m.id)
      );

    const jaCriadosHoje = new Set((tarefasDeHojeDeModelos || []).map((t) => t.origem_modelo_id));
    const paraCriar = modelosRecorrentes.filter((m) => !jaCriadosHoje.has(m.id));

    if (paraCriar.length > 0) {
      await supabase.from('tarefas').insert(
        paraCriar.map((m) => ({
          usuario_id: m.usuario_id,
          titulo: m.titulo_padrao,
          espaco_id: m.espaco_id,
          hora: m.hora_padrao,
          status: 'fazer',
          data_prevista: hoje,
          origem_modelo_id: m.id,
        }))
      );
    }
  }

  const [{ data: tarefasNoHorario, error: erroHorario }, { data: tarefasPresas, error: erroPresas }] =
    await Promise.all([
      supabase
        .from('tarefas')
        .select('id, usuario_id, titulo, hora, status')
        .eq('data_prevista', hoje)
        .in('status', ['fazer', 'andamento'])
        .is('notificado_em', null)
        .not('hora', 'is', null)
        .lte('hora', horaAtual)
        .gte('hora', horaMinima),
      supabase
        .from('tarefas')
        .select('id, usuario_id, titulo, vezes_adiada')
        .eq('status', 'andamento')
        .not('andamento_em', 'is', null)
        .is('atraso_notificado_em', null)
        .lte('andamento_em', new Date(Date.now() - HORAS_ANDAMENTO_PARADO * 60 * 60 * 1000).toISOString()),
    ]);

  if (erroHorario || erroPresas) {
    return new Response(JSON.stringify({ error: erroHorario?.message || erroPresas?.message }), { status: 500 });
  }

  const usuarioIds = [
    ...new Set([...(tarefasNoHorario || []).map((t) => t.usuario_id), ...(tarefasPresas || []).map((t) => t.usuario_id)]),
  ];

  if (usuarioIds.length === 0) {
    return new Response(JSON.stringify({ enviadas: 0 }), { status: 200 });
  }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('usuario_id', usuarioIds);

  let enviadas = 0;
  const endpointsExpirados: string[] = [];

  async function notificar(usuarioId: string, payloadNotificacao: Record<string, unknown>) {
    const inscricoesDoUsuario = (subscriptions || []).filter((s) => s.usuario_id === usuarioId);
    for (const sub of inscricoesDoUsuario) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payloadNotificacao)
        );
        enviadas++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          endpointsExpirados.push(sub.endpoint);
        }
      }
    }
  }

  for (const tarefa of tarefasNoHorario || []) {
    await notificar(tarefa.usuario_id, {
      title: tarefa.titulo,
      body: `Hora de: ${tarefa.titulo}`,
      url: '/',
    });

    const payload: Record<string, unknown> = { notificado_em: new Date().toISOString() };
    if (tarefa.status === 'fazer') {
      payload.status = 'andamento';
      payload.andamento_em = new Date().toISOString();
    }
    await supabase.from('tarefas').update(payload).eq('id', tarefa.id);
  }

  for (const tarefa of tarefasPresas || []) {
    await notificar(tarefa.usuario_id, {
      title: tarefa.titulo,
      body: `Em andamento há mais de ${HORAS_ANDAMENTO_PARADO}h — sem cobrança, só um aviso.`,
      url: '/',
    });

    await supabase
      .from('tarefas')
      .update({
        status: 'atrasado',
        vezes_adiada: (tarefa.vezes_adiada || 0) + 1,
        atraso_notificado_em: new Date().toISOString(),
      })
      .eq('id', tarefa.id);
  }

  if (endpointsExpirados.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', endpointsExpirados);
  }

  return new Response(
    JSON.stringify({ enviadas, noHorario: (tarefasNoHorario || []).length, presas: (tarefasPresas || []).length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
