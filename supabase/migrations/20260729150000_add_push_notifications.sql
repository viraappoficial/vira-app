-- Inscrições de push (Web Push) por dispositivo/navegador do usuário.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_usuario_id_idx on public.push_subscriptions(usuario_id);

alter table public.push_subscriptions enable row level security;

create policy "usuario gerencia suas proprias inscricoes push"
  on public.push_subscriptions
  for all
  to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Marca quando a notificação de horário de uma tarefa já foi enviada, pra não duplicar.
alter table public.tarefas
  add column if not exists notificado_em timestamptz;
