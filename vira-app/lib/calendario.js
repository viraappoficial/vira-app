export const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export const DOW_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function isoDate(year, month, day) {
  const d = new Date(year, month, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayIso() {
  const d = new Date();
  return isoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDaysIso(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return isoDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

export function startOfWeekIso(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay());
  return isoDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

// Retorna os 7 dias (ISO) da semana que contém dateStr.
export function weekDaysOf(dateStr) {
  const start = startOfWeekIso(dateStr);
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDaysIso(start, i));
  return days;
}

// Retorna as células do mês (year/month baseado em 0) pra montar uma grade de 7 colunas,
// com dias do mês anterior/seguinte marcados como `muted` pra preencher a grade.
export function monthCells(year, month) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ iso: null, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ iso: isoDate(year, month, d), day: d, muted: false });
  while (cells.length % 7 !== 0) cells.push({ iso: null, muted: true });
  return cells;
}

export function formatDiaCurto(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${String(dt.getDate()).padStart(2, '0')} ${MESES[dt.getMonth()].slice(0, 3)}`;
}

export function formatDiaLongo(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dt.getDate()} de ${MESES[dt.getMonth()]}`;
}

export function formatDiaRelativo(dateStr) {
  const hoje = todayIso();
  if (dateStr === hoje) return 'Hoje';
  if (dateStr === addDaysIso(hoje, -1)) return 'Ontem';
  return formatDiaLongo(dateStr);
}
