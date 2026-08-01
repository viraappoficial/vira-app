import { supabase } from './supabase';

// Só cobre o caso de "dono" por enquanto (quem criou a organização) — visibilidade
// via convite/membro entra junto com a tela de Equipe (Fase A, próxima etapa).
export async function buscarMinhaOrganizacao(userId) {
  const { data, error } = await supabase
    .from('organizacoes')
    .select('id, nome, cor, criado_em')
    .eq('dono_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function criarOrganizacao({ nome, cor }) {
  const { data, error } = await supabase.functions.invoke('criar-organizacao', {
    body: { nome, cor },
  });
  if (error) {
    const corpo = await error.context?.json?.().catch(() => null);
    throw new Error(corpo?.error || error.message);
  }
  return data;
}
