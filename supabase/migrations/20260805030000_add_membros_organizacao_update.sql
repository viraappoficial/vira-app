-- Permite o líder gerenciar quem está em cada setor: mover um membro pra
-- outro setor que ele também lidera, ou remover (marcar como inativo).
-- USING olha a linha antiga (líder precisa liderar o setor atual do membro),
-- WITH CHECK olha a linha nova (se mudar o setor, precisa liderar o setor
-- de destino também) — então um líder não consegue mover alguém pra um
-- setor fora do que ele controla.

create policy "membros_organizacao_update_lider" on public.membros_organizacao
  for update using (
    public.lidero_o_setor_ou_acima(setor_id, organizacao_id)
  ) with check (
    public.lidero_o_setor_ou_acima(setor_id, organizacao_id)
  );
