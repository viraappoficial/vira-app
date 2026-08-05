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

// --- Setores ---------------------------------------------------------------

export async function listarSetores(organizacaoId) {
  const { data, error } = await supabase
    .from('setores')
    .select('id, nome, cor, setor_pai_id, caminho')
    .eq('organizacao_id', organizacaoId)
    .order('caminho');
  if (error) throw error;
  return data;
}

// Todo setor nasce com um espaço compartilhado próprio (mesmo nome/cor),
// que qualquer membro do setor já pode usar nas tarefas.
export async function criarSetor({ organizacaoId, setorPaiId, nome, cor, criadoPor }) {
  const { data: setor, error: setorError } = await supabase
    .from('setores')
    .insert({ organizacao_id: organizacaoId, setor_pai_id: setorPaiId || null, nome, cor })
    .select()
    .single();
  if (setorError) throw setorError;

  const { error: espacoError } = await supabase.from('espacos').insert({
    usuario_id: criadoPor,
    nome,
    cor,
    organizacao_id: organizacaoId,
    setor_id: setor.id,
    visivel_para_lider: true,
  });
  if (espacoError) throw espacoError;

  return setor;
}

export async function atualizarSetor(setorId, { nome, cor }) {
  const { error } = await supabase.from('setores').update({ nome, cor }).eq('id', setorId);
  if (error) throw error;
  // O espaço do setor acompanha o nome/cor, pra não ficar desalinhado.
  const { error: espacoError } = await supabase.from('espacos').update({ nome, cor }).eq('setor_id', setorId);
  if (espacoError) throw espacoError;
}

export async function listarMembros(organizacaoId) {
  const { data, error } = await supabase
    .from('membros_organizacao')
    .select('usuario_id, setor_id, papel, nome_exibicao, status')
    .eq('organizacao_id', organizacaoId)
    .eq('status', 'ativo');
  if (error) throw error;
  return data;
}

// Tarefas do espaço compartilhado de um setor, já com o nome de quem é
// responsável por cada uma (guardado em membros_organizacao.nome_exibicao,
// já que não dá pra "olhar" o nome de outra conta direto).
export async function listarTarefasDoSetor(setorId, organizacaoId) {
  const { data: espaco, error: espacoError } = await supabase
    .from('espacos')
    .select('id')
    .eq('setor_id', setorId)
    .maybeSingle();
  if (espacoError) throw espacoError;
  if (!espaco) return [];

  const [tarefasRes, membros] = await Promise.all([
    supabase.from('tarefas').select('*').eq('espaco_id', espaco.id).order('data_prevista', { ascending: true }),
    listarMembros(organizacaoId),
  ]);
  if (tarefasRes.error) throw tarefasRes.error;

  const nomesPorUsuario = {};
  membros.forEach((m) => {
    nomesPorUsuario[m.usuario_id] = m.nome_exibicao;
  });

  return (tarefasRes.data || []).map((t) => ({
    ...t,
    nome_responsavel: nomesPorUsuario[t.usuario_id] || 'Alguém do time',
  }));
}
