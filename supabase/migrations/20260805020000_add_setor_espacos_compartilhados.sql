-- Espaço nativo de setor: quando o líder cria/edita um setor, um espaço
-- compartilhado nasce/acompanha ele — todo mundo do setor pode usar esse
-- espaço nas próprias tarefas, e todo mundo do setor enxerga a tarefa de
-- todo mundo *nesse espaço específico* (diferente do espaço pessoal
-- vinculado da Fase A/etapa 4, que só o líder vê, e só se marcado visível).

alter table public.espacos
  add column setor_id uuid references public.setores (id) on delete cascade;

-- Guarda o nome de exibição de cada membro no momento em que entra na
-- organização — não dá pra "olhar" o nome de outra pessoa direto (fica só
-- na conta de login dela), então isso é preenchido pelas Edge Functions
-- (criar-organizacao/aceitar-convite) usando service role.
alter table public.membros_organizacao
  add column nome_exibicao text;

create index espacos_setor_id_idx on public.espacos (setor_id);

-- Nome/cor do espaço de setor não é sensível (mesma lógica já aplicada aos
-- setores) — qualquer membro ativo da organização enxerga a lista.
create policy "espacos_select_setor_organizacao" on public.espacos
  for select using (
    setor_id is not null and public.sou_membro_ativo(organizacao_id)
  );

-- Tarefa arquivada num espaço de setor: qualquer membro ativo *daquele
-- setor específico* (não da organização toda) vê a tarefa, seja lá de
-- quem for — é o ponto principal de um espaço compartilhado: coordenar o
-- time, não só o líder espiar de cima.
create policy "tarefas_select_setor_compartilhado" on public.tarefas
  for select using (
    exists (
      select 1
      from public.espacos e
      join public.membros_organizacao eu
        on eu.usuario_id = (select auth.uid())
        and eu.status = 'ativo'
        and eu.setor_id = e.setor_id
      where e.id = tarefas.espaco_id
        and e.setor_id is not null
    )
  );
