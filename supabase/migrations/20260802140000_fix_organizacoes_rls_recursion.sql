-- Segunda parte da correção de recursão de RLS (ver migration anterior).
--
-- A policy organizacoes_select consultava membros_organizacao diretamente, e
-- membros_organizacao_select consultava organizacoes diretamente — as duas
-- se chamando uma à outra formam um ciclo (A depende de B, B depende de A),
-- mesmo depois de tirar a auto-referência direta de membros_organizacao.
--
-- Fix: mais uma função SECURITY DEFINER (sou_membro_ativo) pra checar
-- participação numa organização sem passar pela RLS de membros_organizacao —
-- usada em organizacoes_select no lugar do EXISTS direto, quebrando o ciclo.

create or replace function public.sou_membro_ativo(alvo_organizacao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from membros_organizacao m
    where m.organizacao_id = alvo_organizacao_id
      and m.usuario_id = auth.uid()
      and m.status = 'ativo'
  );
$$;

drop policy "organizacoes_select" on public.organizacoes;

create policy "organizacoes_select" on public.organizacoes
  for select using (
    dono_id = (select auth.uid())
    or public.sou_membro_ativo(organizacoes.id)
  );
