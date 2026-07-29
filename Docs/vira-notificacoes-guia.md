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
| `VAPID_PUBLIC_KEY` | (gerar com `npx web-push generate-vapid-keys` — nunca commitar o valor real aqui) |
| `VAPID_PRIVATE_KEY` | (idem — só existe no Supabase Dashboard e no seu gerenciador de senhas) |
| `CRON_SECRET` | (uma string aleatória própria — só existe no Supabase Dashboard e no SQL do cron, nunca neste arquivo) |

(`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem por padrão em toda Edge Function,
não precisa configurar.)

A `VAPID_PUBLIC_KEY` também precisa estar embutida no app (`lib/push.js`) — as duas pontas
precisam bater, então não troque uma sem trocar a outra. **Importante:** esses três valores
são segredos de verdade — nunca cole o valor real deles neste arquivo (ou em qualquer
arquivo versionado no Git). Guarde-os só no Supabase Dashboard e num gerenciador de senhas.
Se algum desses valores já foi commitado por engano, ele deve ser considerado comprometido
e rotacionado (gerar um novo e atualizar em todo lugar), mesmo em repositório privado.

## 4. Agendar o cron (roda a cada minuto)

No SQL Editor, rode (troque `<SLUG-DA-FUNCAO>` pela URL real que aparecer na tela da
função — deve ser algo como `enviar-notificacoes`, mas confira, já que já tivemos um caso
de slug diferente do nome de exibição — e `<CRON_SECRET>` pelo valor real que você
configurou no passo 3, sem colar esse valor em nenhum arquivo versionado):

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
      'x-cron-secret', '<CRON_SECRET>'
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
