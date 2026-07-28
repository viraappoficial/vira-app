-- Baseline: espacos, tarefas, modelos (Fase 1) + RLS por usuario_id.
-- Reconstruído a partir do estado real do banco (tabelas criadas originalmente via SQL Editor).

create table public.espacos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id),
  nome text not null,
  cor text not null,
  icone text,
  logo_url text,
  criado_em timestamptz default now()
);

create table public.modelos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id),
  espaco_id uuid references public.espacos (id),
  titulo_padrao text not null,
  hora_padrao time,
  recorrencia text,
  criado_em timestamptz default now()
);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id),
  espaco_id uuid references public.espacos (id),
  titulo text not null,
  descricao text,
  status text not null default 'fazer' check (status in ('fazer', 'andamento', 'concluido', 'atrasado')),
  data_prevista date,
  hora time,
  prioridade text default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  tempo_estimado_min integer,
  tempo_gasto_min integer,
  criado_em timestamptz default now(),
  concluido_em timestamptz,
  origem_modelo_id uuid
);

alter table public.espacos enable row level security;
alter table public.modelos enable row level security;
alter table public.tarefas enable row level security;

create policy "usuario ve seus espacos" on public.espacos
  for select using (auth.uid() = usuario_id);
create policy "usuario cria seus espacos" on public.espacos
  for insert with check (auth.uid() = usuario_id);
create policy "usuario edita seus espacos" on public.espacos
  for update using (auth.uid() = usuario_id);
create policy "usuario deleta seus espacos" on public.espacos
  for delete using (auth.uid() = usuario_id);

create policy "usuario ve seus modelos" on public.modelos
  for select using (auth.uid() = usuario_id);
create policy "usuario cria seus modelos" on public.modelos
  for insert with check (auth.uid() = usuario_id);
create policy "usuario edita seus modelos" on public.modelos
  for update using (auth.uid() = usuario_id);
create policy "usuario deleta seus modelos" on public.modelos
  for delete using (auth.uid() = usuario_id);

create policy "usuario ve suas tarefas" on public.tarefas
  for select using (auth.uid() = usuario_id);
create policy "usuario cria suas tarefas" on public.tarefas
  for insert with check (auth.uid() = usuario_id);
create policy "usuario edita suas tarefas" on public.tarefas
  for update using (auth.uid() = usuario_id);
create policy "usuario deleta suas tarefas" on public.tarefas
  for delete using (auth.uid() = usuario_id);
