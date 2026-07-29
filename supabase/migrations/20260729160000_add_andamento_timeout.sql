-- Marca quando a tarefa entrou em "andamento", pra detectar quando ela fica
-- parada nesse status por muito tempo (3h) sem ser concluída.
alter table public.tarefas
  add column if not exists andamento_em timestamptz;

-- Evita notificar o mesmo atraso-por-parada mais de uma vez.
alter table public.tarefas
  add column if not exists atraso_notificado_em timestamptz;
