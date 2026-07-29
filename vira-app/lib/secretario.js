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

// Chama o Secretário (Edge Function) e devolve os campos já prontos pra ModalNovaTarefa,
// incluindo o mapeamento de nome de espaço -> espaco_id.
export async function chamarSecretario(texto, espacosList) {
  const dataAtual = new Date().toISOString().slice(0, 10);
  const espacos = espacosList.map((e) => e.nome);

  // Nome real do endpoint no Supabase é "smart-api" (slug não muda ao editar o "Name"
  // de exibição no painel) — a função em si é o Secretário, só o slug ficou assim.
  const { data, error } = await supabase.functions.invoke('smart-api', {
    body: { texto, dataAtual, espacos },
  });

  if (error || !data || data.error) {
    const codigo = data?.error;
    const mensagem = MENSAGENS_ERRO[codigo] || 'Secretário indisponível agora, tenta em instantes.';
    throw new Error(mensagem);
  }

  return {
    titulo: data.titulo || texto,
    data_prevista: data.data_prevista || null,
    hora: data.hora || null,
    espaco_id: encontrarEspacoId(data.espaco, espacosList),
    prioridade: ['baixa', 'media', 'alta'].includes(data.prioridade) ? data.prioridade : 'media',
  };
}
