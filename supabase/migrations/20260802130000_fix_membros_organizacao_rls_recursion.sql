-- Corrige "infinite recursion detected in policy for relation membros_organizacao".
--
-- A policy membros_organizacao_select consultava a própria tabela
-- membros_organizacao dentro do seu USING — toda vez que o Postgres avalia a
-- RLS de uma linha, ele reavalia a mesma policy pra resolver a subconsulta,
-- que reavalia de novo, infinitamente. Como a policy de tarefas também junta
-- com membros_organizacao, isso quebrava qualquer select/insert em tarefas
-- (inclusive criar uma tarefa nova, via o .select() que roda logo após o
-- insert).
--
-- Fix: mover a parte recursiva ("eu lidero esse setor ou um setor acima
-- dele?") pra uma função SECURITY DEFINER — ela roda com o privilégio de
-- quem criou a função, então a consulta interna não passa pela RLS de novo,
-- quebrando o ciclo.

create or replace function public.lidero_o_setor_ou_acima(alvo_setor_id uuid, alvo_organizacao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from membros_organizacao lider_m
    join setores lider_setor on lider_setor.id = lider_m.setor_id
    join setores alvo_setor on alvo_setor.id = alvo_setor_id
    where lider_m.usuario_id = auth.uid()
      and lider_m.papel = 'lider'
      and lider_m.status = 'ativo'
      and lider_m.organizacao_id = alvo_organizacao_id
      and alvo_setor.caminho <@ lider_setor.caminho
  );
$$;

drop policy "membros_organizacao_select" on public.membros_organizacao;

create policy "membros_organizacao_select" on public.membros_organizacao
  for select using (
    usuario_id = (select auth.uid())
    or exists (
      select 1 from public.organizacoes o
      where o.id = membros_organizacao.organizacao_id and o.dono_id = (select auth.uid())
    )
    or public.lidero_o_setor_ou_acima(membros_organizacao.setor_id, membros_organizacao.organizacao_id)
  );

drop policy "tarefas_select_lider_organizacao" on public.tarefas;

create policy "tarefas_select_lider_organizacao" on public.tarefas
  for select using (
    exists (
      select 1
      from public.espacos e
      join public.membros_organizacao dono_m
        on dono_m.usuario_id = tarefas.usuario_id
        and dono_m.organizacao_id = e.organizacao_id
        and dono_m.status = 'ativo'
      where e.id = tarefas.espaco_id
        and e.visivel_para_lider = true
        and public.lidero_o_setor_ou_acima(dono_m.setor_id, e.organizacao_id)
    )
  );
