export const GREETINGS = ['Bom dia', 'E aí', 'Bora'];
export const SUBTITLES = [
  'Aqui está o que te espera hoje.',
  'Nada de bagunça — só o que importa hoje.',
  'Um de cada vez, sem pressa.',
];
export const EMPTY_MESSAGES = ['Tudo em dia. Aproveita.', 'Nada pendente. Respira.', 'Zerou. Bom trabalho.'];
export const COMPLETE_MESSAGES = ['Boa.', 'Feito.', 'Isso aí.'];

export function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}
