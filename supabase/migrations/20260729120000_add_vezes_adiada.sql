-- Contador de quantas vezes uma tarefa foi adiada (virou "atrasado" sem ser concluída).
-- Usado pra dar um nudge gentil na UI quando um padrão de adiamento aparece.
alter table public.tarefas
  add column if not exists vezes_adiada integer not null default 0;
