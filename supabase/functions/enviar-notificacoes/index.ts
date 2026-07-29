import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

// Brasil não usa mais horário de verão (desde 2019) — fuso fixo -03:00.
const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;
const JANELA_MIN = 15; // não notifica tarefas com horário passado há mais que isso (ex: cron ficou fora do ar)

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

  const { data: tarefas, error: erroTarefas } = await supabase
    .from('tarefas')
    .select('id, usuario_id, titulo, hora, status')
    .eq('data_prevista', hoje)
    .in('status', ['fazer', 'andamento'])
    .is('notificado_em', null)
    .not('hora', 'is', null)
    .lte('hora', horaAtual)
    .gte('hora', horaMinima);

  if (erroTarefas) {
    return new Response(JSON.stringify({ error: erroTarefas.message }), { status: 500 });
  }

  if (!tarefas || tarefas.length === 0) {
    return new Response(JSON.stringify({ enviadas: 0 }), { status: 200 });
  }

  const usuarioIds = [...new Set(tarefas.map((t) => t.usuario_id))];
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('usuario_id', usuarioIds);

  let enviadas = 0;
  const endpointsExpirados: string[] = [];

  for (const tarefa of tarefas) {
    const inscricoesDoUsuario = (subscriptions || []).filter((s) => s.usuario_id === tarefa.usuario_id);

    for (const sub of inscricoesDoUsuario) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: tarefa.titulo,
            body: `Hora de: ${tarefa.titulo}`,
            url: '/',
          })
        );
        enviadas++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          endpointsExpirados.push(sub.endpoint);
        }
      }
    }

    const payload: Record<string, unknown> = { notificado_em: new Date().toISOString() };
    if (tarefa.status === 'fazer') payload.status = 'andamento';

    await supabase.from('tarefas').update(payload).eq('id', tarefa.id);
  }

  if (endpointsExpirados.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', endpointsExpirados);
  }

  return new Response(JSON.stringify({ enviadas, tarefas: tarefas.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
