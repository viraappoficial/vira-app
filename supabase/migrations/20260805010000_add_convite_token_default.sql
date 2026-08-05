-- Gera o token do convite automaticamente no banco (uuid aleatório em texto),
-- pra não precisar gerar isso no cliente.
alter table public.convites_organizacao
  alter column token set default gen_random_uuid()::text;
