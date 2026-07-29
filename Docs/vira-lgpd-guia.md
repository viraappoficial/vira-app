# LGPD — guia de deploy

Duas coisas pra publicar no Supabase pra fechar a parte técnica da LGPD (o resto — Política de
Privacidade, Termos, checkbox de consentimento — já é só código do app, sem passo manual).

## 1. Rodar a migration

No SQL Editor do Supabase, rode o conteúdo de
`supabase/migrations/20260729170000_add_account_deletion_cascade.sql`.

Ela troca as foreign keys de `espacos`, `modelos` e `tarefas` pra `on delete cascade` — sem
isso, excluir a conta falha porque o Postgres barra a exclusão de um usuário que ainda tem
linhas referenciando ele.

## 2. Deploy da Edge Function `excluir-conta`

Crie uma nova função **"Via Editor"** com o nome exato **`excluir-conta`** e cole o conteúdo de
`supabase/functions/excluir-conta/index.ts`.

Deixe **"Verify JWT with legacy secret" LIGADO** (é o padrão) — essa função só pode ser chamada
por quem já está logado, nunca sem sessão, senão qualquer um poderia apagar a conta de
qualquer um.

Não precisa configurar nenhum secret novo — ela usa `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY`, que já existem por padrão em toda Edge Function.

## 3. Testar

1. Crie uma conta de teste (não use a sua!) com um e-mail qualquer.
2. Faça login, entre em Espaços (engrenagem) → Excluir minha conta → confirme.
3. Confira no Supabase Dashboard → Authentication → Users que o usuário sumiu, e no Table
   Editor que os espaços/tarefas/modelos dele também sumiram.

## O que mais mudou (sem passo manual)

- `screens/LegalScreen.js` — Política de Privacidade e Termos de Uso dentro do app, acessível
  na tela de criar conta e em Espaços → Privacidade e termos de uso.
- Cadastro agora exige marcar "Li e aceito..." antes de criar conta — a hora exata do aceite
  fica guardada no perfil do usuário (`user_metadata.termos_aceitos_em`), como prova de
  consentimento.
