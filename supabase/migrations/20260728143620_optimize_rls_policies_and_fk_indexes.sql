-- espacos
alter policy "usuario cria seus espacos" on public.espacos with check ((select auth.uid()) = usuario_id);
alter policy "usuario deleta seus espacos" on public.espacos using ((select auth.uid()) = usuario_id);
alter policy "usuario edita seus espacos" on public.espacos using ((select auth.uid()) = usuario_id);
alter policy "usuario ve seus espacos" on public.espacos using ((select auth.uid()) = usuario_id);

-- modelos
alter policy "usuario cria seus modelos" on public.modelos with check ((select auth.uid()) = usuario_id);
alter policy "usuario deleta seus modelos" on public.modelos using ((select auth.uid()) = usuario_id);
alter policy "usuario edita seus modelos" on public.modelos using ((select auth.uid()) = usuario_id);
alter policy "usuario ve seus modelos" on public.modelos using ((select auth.uid()) = usuario_id);

-- tarefas
alter policy "usuario cria suas tarefas" on public.tarefas with check ((select auth.uid()) = usuario_id);
alter policy "usuario deleta suas tarefas" on public.tarefas using ((select auth.uid()) = usuario_id);
alter policy "usuario edita suas tarefas" on public.tarefas using ((select auth.uid()) = usuario_id);
alter policy "usuario ve suas tarefas" on public.tarefas using ((select auth.uid()) = usuario_id);

-- covering indexes for foreign keys
create index if not exists espacos_usuario_id_idx on public.espacos (usuario_id);
create index if not exists modelos_espaco_id_idx on public.modelos (espaco_id);
create index if not exists modelos_usuario_id_idx on public.modelos (usuario_id);
create index if not exists tarefas_espaco_id_idx on public.tarefas (espaco_id);
create index if not exists tarefas_usuario_id_idx on public.tarefas (usuario_id);
