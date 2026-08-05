import { supabase } from './supabase';

// Primeiro tenta como dono (quem criou a organização); se não for dono, checa
// se é membro (aceitou um convite) — cobre os dois lados: líder e colaborador.
export async function buscarMinhaOrganizacao(userId) {
  const { data: comoDono, error: erroDono } = await supabase
    .from('organizacoes')
    .select('id, nome, cor, criado_em')
    .eq('dono_id', userId)
    .maybeSingle();
  if (erroDono) throw erroDono;
  if (comoDono) return { ...comoDono, papel: 'lider' };

  const { data: comoMembro, error: erroMembro } = await supabase
    .from('membros_organizacao')
    .select('papel, organizacoes (id, nome, cor, criado_em)')
    .eq('usuario_id', userId)
    .eq('status', 'ativo')
    .maybeSingle();
  if (erroMembro) throw erroMembro;
  if (comoMembro?.organizacoes) return { ...comoMembro.organizacoes, papel: comoMembro.papel };

  return null;
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

// Fase A só tem um setor por organização (o "Geral" criado junto) — convite
// sempre vai pra ele por enquanto, até a tela de Equipe permitir escolher.
export async function buscarSetorPrincipal(organizacaoId) {
  const { data, error } = await supabase
    .from('setores')
    .select('id, nome')
    .eq('organizacao_id', organizacaoId)
    .is('setor_pai_id', null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function criarConvite({ organizacaoId, setorId, criadoPor }) {
  const { data, error } = await supabase
    .from('convites_organizacao')
    .insert({ organizacao_id: organizacaoId, setor_id: setorId, criado_por: criadoPor })
    .select('token')
    .single();
  if (error) throw error;
  return data;
}

export function linkConvite(token) {
  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://vira.app.br';
  return `${origem}/?convite=${token}`;
}

async function chamarFuncaoConvite(nome, body) {
  const { data, error } = await supabase.functions.invoke(nome, { body });
  if (error) {
    const corpo = await error.context?.json?.().catch(() => null);
    throw new Error(corpo?.error || error.message);
  }
  return data;
}

export function validarConvite(token) {
  return chamarFuncaoConvite('validar-convite', { token });
}

export function aceitarConvite(token) {
  return chamarFuncaoConvite('aceitar-convite', { token });
}
