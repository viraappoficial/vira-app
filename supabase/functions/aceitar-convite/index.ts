import { createClient } from 'npm:@supabase/supabase-js@2';

// Precisa de sessão (Verify JWT ligado) — só depois que a pessoa já tem conta
// e está logada é que o convite vira participação de verdade.

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
  const token = (body.token || '').trim();
  if (!token) return erro('Link de convite inválido.', 400);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: convite, error: conviteError } = await supabaseAdmin
    .from('convites_organizacao')
    .select('id, organizacao_id, setor_id, papel, status, expira_em, organizacoes(nome, cor)')
    .eq('token', token)
    .maybeSingle();

  if (conviteError) return erro(conviteError.message, 500);
  if (!convite) return erro('Convite não encontrado — o link pode estar errado.', 404);
  if (convite.status === 'revogado') return erro('Esse convite foi cancelado.', 410);
  if (new Date(convite.expira_em) < new Date()) return erro('Esse convite expirou.', 410);

  const { error: membroError } = await supabaseAdmin.from('membros_organizacao').upsert(
    {
      organizacao_id: convite.organizacao_id,
      usuario_id: userData.user.id,
      setor_id: convite.setor_id,
      papel: convite.papel,
      status: 'ativo',
      nome_exibicao: nomeDeExibicao(userData.user),
    },
    { onConflict: 'organizacao_id,usuario_id' }
  );
  if (membroError) return erro(membroError.message, 500);

  if (convite.status !== 'aceito') {
    await supabaseAdmin.from('convites_organizacao').update({ status: 'aceito' }).eq('id', convite.id);
  }

  return new Response(JSON.stringify({ organizacao: convite.organizacoes }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
