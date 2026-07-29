# Notificações de horário — guia de deploy

O Vira agora pode avisar (via Web Push) quando bater o horário marcado de uma tarefa —
funciona no navegador, no celular (inclusive fora do app, na bandeja de notificações do
sistema) e no computador. No iPhone, só funciona se a pessoa "adicionar à tela de início"
(o Safari sozinho, direto pela aba, não permite push em segundo plano).

Como o Supabase MCP não está disponível nesta sessão, siga os passos abaixo manualmente
pelo Dashboard, na mesma ordem.

## 1. Rodar a migration

No SQL Editor do Supabase, rode o conteúdo de
`supabase/migrations/20260729150000_add_push_notifications.sql` — cria a tabela
`push_subscriptions` e a coluna `tarefas.notificado_em`.

## 2. Deploy da Edge Function

Crie uma nova função **"Via Editor"** com o nome exato **`enviar-notificacoes`**
(não renomear depois — o slug não muda ao editar o "Name" de exibição).

Cole o conteúdo de `supabase/functions/enviar-notificacoes/index.ts` e dê deploy.

## 3. Configurar os secrets da função

Em Edge Functions → Secrets, adicione:

| Nome | Valor |
| --- | --- |
| `VAPID_PUBLIC_KEY` | `BBBFNEY1ocZOls-Ix1ADMqywBQ2-M0QSG8h2fHgEBMzHhZTBcc-EzKwMU632KETdGR3kHQrD1Ne2sOEKyTmFk1E` |
| `VAPID_PRIVATE_KEY` | `WT5ABMRXWy4oY-Z7VpOm95sW1uSEumAY5LgBTrF1nlo` |
| `CRON_SECRET` | `a3e63fb3f38b7da5a4b65477cb7b97c50c07ddeb861f8795` |

(`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem por padrão em toda Edge Function,
não precisa configurar.)

A `VAPID_PUBLIC_KEY` também já está embutida no app (`lib/push.js`) — as duas pontas
precisam bater, então não troque uma sem trocar a outra.

## 4. Agendar o cron (roda a cada minuto)

No SQL Editor, rode (troque `<SLUG-DA-FUNCAO>` pela URL real que aparecer na tela da
função — deve ser algo como `enviar-notificacoes`, mas confira, já que já tivemos um caso
de slug diferente do nome de exibição):

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'enviar-notificacoes-a-cada-minuto',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://vpygbkwhfpyhabutgxxl.supabase.co/functions/v1/<SLUG-DA-FUNCAO>',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'a3e63fb3f38b7da5a4b65477cb7b97c50c07ddeb861f8795'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## 5. Testar

1. Abra o app no navegador, vá em Espaços (engrenagem) e ative "Notificações de horário"
   — o navegador vai pedir permissão, aceite.
2. Crie uma tarefa com horário pra 1-2 minutos à frente.
3. Espere passar do horário — em até 1 minuto a notificação deve aparecer, mesmo com a
   aba em segundo plano ou o navegador minimizado.

## Limitações conhecidas (v1)

- O fuso horário é fixo em America/São_Paulo (UTC-3) no lado do servidor — não lê o fuso
  real do usuário. Ok pro uso atual (você), mas vale revisar se o Vira ganhar usuários
  fora desse fuso.
- Se o cron ficar fora do ar por mais de 15 minutos, tarefas com horário já muito
  passado não disparam notificação atrasada (evita enviar avisos de coisas de horas
  atrás quando o sistema volta).
