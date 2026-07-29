import { supabase } from './supabase';

const MENSAGENS_ERRO = {
  limite_excedido: 'Resumo ocupado, tenta em instantes.',
  resumo_indisponivel: 'Resumo indisponível agora, tenta em instantes.',
  resposta_invalida: 'Não consegui montar o resumo agora.',
  requisicao_invalida: 'Não consegui montar o resumo agora.',
};

// Chama a Edge Function que gera o resumo do dia em linguagem natural via Gemini.
export async function chamarResumoDia(nomeUsuario, tarefasHoje) {
  const tarefas = tarefasHoje.map((t) => ({
    titulo: t.titulo,
    status: t.status,
    prioridade: t.prioridade,
    hora: t.hora || null,
  }));

  const { data, error } = await supabase.functions.invoke('resumo-dia', {
    body: { nomeUsuario, tarefas },
  });

  if (error || !data || data.error) {
    const codigo = data?.error;
    const mensagem = MENSAGENS_ERRO[codigo] || 'Resumo indisponível agora, tenta em instantes.';
    throw new Error(mensagem);
  }

  return data.resumo;
}
