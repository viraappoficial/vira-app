-- Permite excluir a conta (auth.users) e ter espaços/tarefas/modelos apagados junto,
-- em vez de travar por causa de FK. Necessário pra função excluir-conta funcionar.

alter table public.espacos drop constraint espacos_usuario_id_fkey;
alter table public.espacos
  add constraint espacos_usuario_id_fkey foreign key (usuario_id) references auth.users (id) on delete cascade;

alter table public.modelos drop constraint modelos_usuario_id_fkey;
alter table public.modelos
  add constraint modelos_usuario_id_fkey foreign key (usuario_id) references auth.users (id) on delete cascade;

alter table public.modelos drop constraint modelos_espaco_id_fkey;
alter table public.modelos
  add constraint modelos_espaco_id_fkey foreign key (espaco_id) references public.espacos (id) on delete cascade;

alter table public.tarefas drop constraint tarefas_usuario_id_fkey;
alter table public.tarefas
  add constraint tarefas_usuario_id_fkey foreign key (usuario_id) references auth.users (id) on delete cascade;

alter table public.tarefas drop constraint tarefas_espaco_id_fkey;
alter table public.tarefas
  add constraint tarefas_espaco_id_fkey foreign key (espaco_id) references public.espacos (id) on delete cascade;
