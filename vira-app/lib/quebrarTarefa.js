import { supabase } from './supabase';

const MENSAGENS_ERRO = {
  limite_excedido: 'IA ocupada, tenta em instantes.',
  quebrar_indisponivel: 'Indisponível agora, tenta em instantes.',
  resposta_invalida: 'Não consegui pensar em subtarefas agora.',
  requisicao_invalida: 'Não consegui pensar em subtarefas agora.',
};

// Chama a Edge Function que sugere subtarefas menores pra uma tarefa que anda sendo adiada.
export async function chamarQuebrarTarefa(titulo, descricao, areaAtuacao) {
  const { data, error } = await supabase.functions.invoke('quebrar-tarefa', {
    body: { titulo, descricao: descricao || '', areaAtuacao: areaAtuacao || null },
  });

  if (error || !data || data.error) {
    const codigo = data?.error;
    const mensagem = MENSAGENS_ERRO[codigo] || 'Indisponível agora, tenta em instantes.';
    throw new Error(mensagem);
  }

  return data.sugestoes;
}
