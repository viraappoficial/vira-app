import { createClient } from 'npm:@supabase/supabase-js@2';

// Pública (sem JWT) — quem recebe o link pode nem ter conta ainda.
// Só lê o convite (nome da organização/setor) pra mostrar antes do cadastro/login.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const body = await req.json().catch(() => ({}));
  const token = (body.token || '').trim();
  if (!token) return erro('Link de convite inválido.', 400);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: convite, error: conviteError } = await supabaseAdmin
    .from('convites_organizacao')
    .select('id, status, expira_em, papel, organizacoes(nome, cor), setores(nome)')
    .eq('token', token)
    .maybeSingle();

  if (conviteError) return erro(conviteError.message, 500);
  if (!convite) return erro('Convite não encontrado — o link pode estar errado.', 404);
  if (convite.status === 'aceito') return erro('Esse convite já foi aceito.', 410);
  if (convite.status === 'revogado') return erro('Esse convite foi cancelado.', 410);
  if (new Date(convite.expira_em) < new Date()) return erro('Esse convite expirou.', 410);

  return new Response(
    JSON.stringify({
      organizacao: convite.organizacoes,
      setor: convite.setores,
      papel: convite.papel,
    }),
    { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
});
