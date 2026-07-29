export const GREETINGS = ['Bom dia', 'E aí', 'Bora'];
export const SUBTITLES = [
  'Aqui está o que te espera hoje.',
  'Nada de bagunça — só o que importa hoje.',
  'Um de cada vez, sem pressa.',
];
export const EMPTY_MESSAGES = ['Tudo em dia. Aproveita.', 'Nada pendente. Respira.', 'Zerou. Bom trabalho.'];
export const COMPLETE_MESSAGES = ['Boa.', 'Feito.', 'Isso aí.'];
export const ATRASADO_MESSAGES = ['Ficou pra trás — bora resolver?', 'Isso ainda te espera.', 'Passou da hora, mas tá aqui.'];
export const VIRAR_DIA_MESSAGES = [
  'Novo dia. O que não rolou ontem, tá aqui de novo — sem drama.',
  'Dia novo, lista limpa de culpa.',
];

// Exemplos pro campo de título do modal de Nova tarefa — alterna entre uma tarefa só
// e várias, pra "ensinar" na prática que o Secretário separa tudo sozinho.
export const TITULO_PLACEHOLDERS = [
  'O que você precisa lembrar?',
  'Ex: falar com a Rebeca sobre o convênio PF',
  'Ex: ligar pro fornecedor, falar com a Rebeca e comprar remédio',
  'Ex: reunião com o time às 15h',
  'Ex: pagar o boleto, buscar as notas e responder o e-mail',
];

export function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}
