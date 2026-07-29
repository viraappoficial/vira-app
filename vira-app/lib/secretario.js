import { supabase } from './supabase';

const MENSAGENS_ERRO = {
  texto_vazio: 'Escreve alguma coisa primeiro.',
  limite_excedido: 'Secretário ocupado, tenta em instantes.',
  secretario_indisponivel: 'Secretário indisponível agora, tenta em instantes.',
  resposta_invalida: 'Não entendi direito — tenta descrever de outro jeito.',
  requisicao_invalida: 'Não entendi direito — tenta descrever de outro jeito.',
};

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function encontrarEspacoId(nomeEspaco, espacosList) {
  if (!nomeEspaco) return null;
  const alvo = normalizar(nomeEspaco);
  const exato = espacosList.find((e) => normalizar(e.nome) === alvo);
  if (exato) return exato.id;
  const parcial = espacosList.find(
    (e) => normalizar(e.nome).includes(alvo) || alvo.includes(normalizar(e.nome))
  );
  return parcial ? parcial.id : null;
}

// Chama o Secretário (Edge Function) e devolve uma lista de tarefas já prontas pra criar —
// 1 item quando é uma tarefa só (caso comum, preenche o modal pra revisão), N itens quando
// o texto descrevia várias ações distintas, incluindo o mapeamento de espaço -> espaco_id.
export async function chamarSecretario(texto, espacosList, areaAtuacao) {
  const dataAtual = new Date().toISOString().slice(0, 10);
  const espacos = espacosList.map((e) => e.nome);

  // Nome real do endpoint no Supabase é "smart-api" (slug não muda ao editar o "Name"
  // de exibição no painel) — a função em si é o Secretário, só o slug ficou assim.
  const { data, error } = await supabase.functions.invoke('smart-api', {
    body: { texto, dataAtual, espacos, areaAtuacao: areaAtuacao || null },
  });

  if (error || !data || data.error) {
    const codigo = data?.error;
    const mensagem = MENSAGENS_ERRO[codigo] || 'Secretário indisponível agora, tenta em instantes.';
    throw new Error(mensagem);
  }

  const lista = Array.isArray(data.tarefas) ? data.tarefas : [data];

  return lista.map((t) => ({
    titulo: t.titulo || texto,
    descricao: t.descricao || '',
    data_prevista: t.data_prevista || null,
    hora: t.hora || null,
    espaco_id: encontrarEspacoId(t.espaco, espacosList),
    prioridade: ['baixa', 'media', 'alta'].includes(t.prioridade) ? t.prioridade : 'media',
  }));
}
