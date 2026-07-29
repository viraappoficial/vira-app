const PRIORIDADE_RANK = { alta: 0, media: 1, baixa: 2 };

// Regra simples (sem IA): atrasado primeiro, depois por prioridade manual, depois por horário.
export function compararTarefas(a, b) {
  const aAtrasada = a.status === 'atrasado' ? 0 : 1;
  const bAtrasada = b.status === 'atrasado' ? 0 : 1;
  if (aAtrasada !== bAtrasada) return aAtrasada - bAtrasada;

  const aPrioridade = PRIORIDADE_RANK[a.prioridade] ?? 1;
  const bPrioridade = PRIORIDADE_RANK[b.prioridade] ?? 1;
  if (aPrioridade !== bPrioridade) return aPrioridade - bPrioridade;

  if (!a.hora) return b.hora ? 1 : 0;
  if (!b.hora) return -1;
  return a.hora.localeCompare(b.hora);
}

export function ordenarPorPrioridade(tasks) {
  return [...tasks].sort(compararTarefas);
}
