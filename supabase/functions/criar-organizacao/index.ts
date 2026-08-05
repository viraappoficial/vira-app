import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function erro(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function nomeDeExibicao(user: { user_metadata?: { nome?: string }; email?: string }) {
  const nome = user.user_metadata?.nome?.trim();
  if (nome) return nome;
  const local = (user.email || '').split('@')[0] || 'Usuário';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return erro('Sem autenticação.', 401);

  const supabaseUsuario = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData, error: userError } = await supabaseUsuario.auth.getUser();
  if (userError || !userData.user) return erro('Sessão inválida.', 401);

  const body = await req.json().catch(() => ({}));
  const nome = (body.nome || '').trim();
  const cor = body.cor || '#5B8CFF';
  if (!nome) return erro('Nome da organização é obrigatório.', 400);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizacoes')
    .insert({ nome, cor, dono_id: userData.user.id })
    .select()
    .single();
  if (orgError) return erro(orgError.message, 500);

  const { data: setor, error: setorError } = await supabaseAdmin
    .from('setores')
    .insert({ organizacao_id: org.id, nome: 'Geral', cor })
    .select()
    .single();
  if (setorError) {
    await supabaseAdmin.from('organizacoes').delete().eq('id', org.id);
    return erro(setorError.message, 500);
  }

  // Todo setor já nasce com um espaço compartilhado próprio, pronto pra
  // qualquer membro do setor usar nas tarefas.
  const { error: espacoError } = await supabaseAdmin.from('espacos').insert({
    usuario_id: userData.user.id,
    nome: setor.nome,
    cor,
    organizacao_id: org.id,
    setor_id: setor.id,
    visivel_para_lider: true,
  });
  if (espacoError) {
    await supabaseAdmin.from('organizacoes').delete().eq('id', org.id);
    return erro(espacoError.message, 500);
  }

  const { error: membroError } = await supabaseAdmin.from('membros_organizacao').insert({
    organizacao_id: org.id,
    usuario_id: userData.user.id,
    setor_id: setor.id,
    papel: 'lider',
    status: 'ativo',
    nome_exibicao: nomeDeExibicao(userData.user),
  });
  if (membroError) {
    await supabaseAdmin.from('organizacoes').delete().eq('id', org.id);
    return erro(membroError.message, 500);
  }

  return new Response(JSON.stringify({ organizacao: org, setor }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
