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

export function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}
