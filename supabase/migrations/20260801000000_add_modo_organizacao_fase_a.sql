-- Modo Organização — Fase A (estrutura + visibilidade, somente leitura pro líder).
-- Ver Docs/vira-modo-organizacao-fase-a.md e a seção 7.6 do briefing pro desenho completo.
-- Escopo desta migration: organizacoes, setores (árvore via ltree), membros_organizacao,
-- convites_organizacao, e as extensões em espacos/tarefas necessárias pro líder enxergar
-- o board do time. Fase B (comentários, atribuição, transferência) fica pra depois.

create extension if not exists ltree;

-- 1. Organizações -----------------------------------------------------------

create table public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references auth.users (id),
  nome text not null,
  cor text not null default '#5B8CFF',
  plano text not null default 'free',
  criado_em timestamptz not null default now()
);

alter table public.organizacoes enable row level security;

create policy "organizacoes_select" on public.organizacoes
  for select using (
    dono_id = (select auth.uid())
    or exists (
      select 1 from public.membros_organizacao m
      where m.organizacao_id = organizacoes.id
        and m.usuario_id = (select auth.uid())
        and m.status = 'ativo'
    )
  );

create policy "organizacoes_insert" on public.organizacoes
  for insert with check (dono_id = (select auth.uid()));

create policy "organizacoes_update" on public.organizacoes
  for update using (dono_id = (select auth.uid()));

create policy "organizacoes_delete" on public.organizacoes
  for delete using (dono_id = (select auth.uid()));

-- 2. Setores (árvore de profundidade livre) ----------------------------------
-- `caminho` guarda o materialized path (ex: raiz.vendas.loja1) — permite achar
-- "tudo abaixo de X" com o operador <@ do ltree, em vez de CTE recursiva.
-- Limitação conhecida da Fase A: mover um setor pra outro pai depois de criado
-- não é suportado ainda (exigiria recalcular o caminho de toda a subárvore).

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes (id) on delete cascade,
  setor_pai_id uuid references public.setores (id) on delete cascade,
  nome text not null,
  cor text not null default '#5B8CFF',
  caminho ltree,
  criado_em timestamptz not null default now()
);

create index setores_organizacao_id_idx on public.setores (organizacao_id);
create index setores_caminho_idx on public.setores using gist (caminho);

create function public.setores_calcular_caminho() returns trigger as $$
begin
  if new.setor_pai_id is null then
    new.caminho := replace(new.id::text, '-', '_')::ltree;
  else
    select caminho || replace(new.id::text, '-', '_')::ltree
      into new.caminho
      from public.setores
      where id = new.setor_pai_id;
    if new.caminho is null then
      raise exception 'setor_pai_id % não encontrado', new.setor_pai_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_setores_calcular_caminho
  before insert on public.setores
  for each row execute function public.setores_calcular_caminho();

alter table public.setores enable row level security;

-- Nome/estrutura dos setores não é dado sensível — qualquer membro ativo
-- da organização enxerga a lista inteira (precisa pra navegação/filtro).
create policy "setores_select" on public.setores
  for select using (
    exists (
      select 1 from public.membros_organizacao m
      where m.organizacao_id = setores.organizacao_id
        and m.usuario_id = (select auth.uid())
        and m.status = 'ativo'
    )
    or exists (
      select 1 from public.organizacoes o
      where o.id = setores.organizacao_id and o.dono_id = (select auth.uid())
    )
  );

create policy "setores_insert" on public.setores
  for insert with check (
    exists (
      select 1 from public.organizacoes o
      where o.id = setores.organizacao_id and o.dono_id = (select auth.uid())
    )
    or exists (
      select 1 from public.membros_organizacao m
      where m.organizacao_id = setores.organizacao_id
        and m.usuario_id = (select auth.uid())
        and m.papel = 'lider'
        and m.status = 'ativo'
    )
  );

create policy "setores_update" on public.setores
  for update using (
    exists (
      select 1 from public.organizacoes o
      where o.id = setores.organizacao_id and o.dono_id = (select auth.uid())
    )
  );

create policy "setores_delete" on public.setores
  for delete using (
    exists (
      select 1 from public.organizacoes o
      where o.id = setores.organizacao_id and o.dono_id = (select auth.uid())
    )
  );

-- 3. Membros da organização --------------------------------------------------

create table public.membros_organizacao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  papel text not null check (papel in ('lider', 'colaborador')),
  status text not null default 'ativo' check (status in ('convidado', 'ativo', 'removido')),
  criado_em timestamptz not null default now(),
  unique (organizacao_id, usuario_id)
);

create index membros_organizacao_usuario_id_idx on public.membros_organizacao (usuario_id);
create index membros_organizacao_setor_id_idx on public.membros_organizacao (setor_id);

alter table public.membros_organizacao enable row level security;

-- Cada um vê a própria linha; líder vê todo mundo do seu setor pra baixo
-- (usando o caminho do setor de quem lidera vs. o caminho do setor do membro).
create policy "membros_organizacao_select" on public.membros_organizacao
  for select using (
    usuario_id = (select auth.uid())
    or exists (
      select 1 from public.organizacoes o
      where o.id = membros_organizacao.organizacao_id and o.dono_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.membros_organizacao lider_m
      join public.setores lider_setor on lider_setor.id = lider_m.setor_id
      join public.setores meu_setor on meu_setor.id = membros_organizacao.setor_id
      where lider_m.usuario_id = (select auth.uid())
        and lider_m.papel = 'lider'
        and lider_m.status = 'ativo'
        and lider_m.organizacao_id = membros_organizacao.organizacao_id
        and meu_setor.caminho <@ lider_setor.caminho
    )
  );

-- Inserção/atualização de membro só acontece via Edge Function com service
-- role (fluxo de convite) — não expomos insert/update direto pro cliente
-- ainda na Fase A, pra não precisar validar convite dentro de RLS.

-- 4. Convites -----------------------------------------------------------------

create table public.convites_organizacao (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid not null references public.organizacoes (id) on delete cascade,
  setor_id uuid not null references public.setores (id) on delete cascade,
  token text not null unique,
  papel text not null default 'colaborador' check (papel in ('lider', 'colaborador')),
  status text not null default 'pendente' check (status in ('pendente', 'aceito', 'revogado')),
  criado_por uuid not null references auth.users (id),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '30 days')
);

create index convites_organizacao_token_idx on public.convites_organizacao (token);

alter table public.convites_organizacao enable row level security;

-- Só líder/dono enxerga a lista de convites da própria organização.
-- Validar um token específico (antes do cadastro) passa pela Edge Function
-- validar-convite, com service role — não por select direto na tabela.
create policy "convites_organizacao_select" on public.convites_organizacao
  for select using (
    exists (
      select 1 from public.organizacoes o
      where o.id = convites_organizacao.organizacao_id and o.dono_id = (select auth.uid())
    )
    or exists (
      select 1 from public.membros_organizacao m
      where m.organizacao_id = convites_organizacao.organizacao_id
        and m.usuario_id = (select auth.uid())
        and m.papel = 'lider'
        and m.status = 'ativo'
    )
  );

create policy "convites_organizacao_insert" on public.convites_organizacao
  for insert with check (
    criado_por = (select auth.uid())
    and (
      exists (
        select 1 from public.organizacoes o
        where o.id = convites_organizacao.organizacao_id and o.dono_id = (select auth.uid())
      )
      or exists (
        select 1 from public.membros_organizacao m
        where m.organizacao_id = convites_organizacao.organizacao_id
          and m.usuario_id = (select auth.uid())
          and m.papel = 'lider'
          and m.status = 'ativo'
      )
    )
  );

create policy "convites_organizacao_update" on public.convites_organizacao
  for update using (
    exists (
      select 1 from public.organizacoes o
      where o.id = convites_organizacao.organizacao_id and o.dono_id = (select auth.uid())
    )
  );

-- 5. Extensões em espacos e tarefas -------------------------------------------

alter table public.espacos
  add column organizacao_id uuid references public.organizacoes (id) on delete set null,
  add column visivel_para_lider boolean not null default false;

create index espacos_organizacao_id_idx on public.espacos (organizacao_id);

-- Líder enxerga (só leitura, via política já existente + esta nova) as tarefas
-- de quem está no seu setor pra baixo, mas só as que vivem num espaço marcado
-- como visível — tarefa sem espaço, ou espaço não marcado, continua privada.
create policy "tarefas_select_lider_organizacao" on public.tarefas
  for select using (
    exists (
      select 1
      from public.espacos e
      join public.membros_organizacao lider_m
        on lider_m.usuario_id = (select auth.uid())
        and lider_m.papel = 'lider'
        and lider_m.status = 'ativo'
        and lider_m.organizacao_id = e.organizacao_id
      join public.setores lider_setor on lider_setor.id = lider_m.setor_id
      join public.membros_organizacao dono_m
        on dono_m.usuario_id = tarefas.usuario_id
        and dono_m.organizacao_id = e.organizacao_id
        and dono_m.status = 'ativo'
      join public.setores dono_setor on dono_setor.id = dono_m.setor_id
      where e.id = tarefas.espaco_id
        and e.visivel_para_lider = true
        and dono_setor.caminho <@ lider_setor.caminho
    )
  );
