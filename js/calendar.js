// Datas comemorativas, clima e maré. Tudo é calculado a partir da data, sem servidor,
// então qualquer ilha funciona sem configuração.

const DAY_MS = 24 * 60 * 60 * 1000;

// Domingo de Páscoa no calendário gregoriano (algoritmo de Meeus/Jones/Butcher).
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function carnivalTuesday(year) {
  const easter = easterSunday(year);
  return new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 47);
}

export function holidayOn(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 12 && day >= 29) || (month === 1 && day === 1)) return 'anoNovo';
  if (month === 12 && day >= 23 && day <= 25) return 'natal';
  if (month === 10 && day >= 29) return 'halloween';
  if (month === 3 && day >= 15 && day <= 17) return 'saoPatricio';
  if (month === 6 && day >= 13 && day <= 29) return 'festaJunina';
  if (month === 7 && day >= 3 && day <= 5) return 'independencia';
  const tuesday = carnivalTuesday(date.getFullYear());
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysBefore = Math.round((tuesday - today) / DAY_MS);
  if (daysBefore >= 0 && daysBefore <= 3) return 'carnaval';
  return null;
}

function hash(value) {
  let result = Math.imul(value ^ 0x9e3779b9, 2654435761);
  result ^= result >>> 15;
  result = Math.imul(result, 2246822519);
  return (result ^ (result >>> 13)) >>> 0;
}

// Cada hora de cada ilha tem um clima fixo, igual para todos os visitantes.
export function weatherAt(seed, date) {
  const hourIndex = Math.floor(date.getTime() / (60 * 60 * 1000));
  const roll = hash(hourIndex + seed) % 100;
  if (roll < 14) return 'chuva';
  const hour = date.getHours();
  if (hour >= 11 && hour <= 15 && roll < 50) return 'calor';
  return 'limpo';
}

// De 0 (maré baixa) a 1 (maré alta), com o período real de cerca de 12,4 horas.
export function tideLevel(date) {
  const hours = date.getTime() / (60 * 60 * 1000);
  return 0.5 + 0.5 * Math.cos((hours / 12.42) * Math.PI * 2);
}

export function isLowTide(date) {
  return tideLevel(date) < 0.3;
}

export function daysOnIsland(createdAt, now = new Date()) {
  const start = Date.parse(createdAt);
  if (!Number.isFinite(start)) return null;
  return Math.max(1, Math.floor((now.getTime() - start) / DAY_MS) + 1);
}

export function isAnniversary(createdAt, now = new Date()) {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return false;
  return (
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate() &&
    start.getFullYear() < now.getFullYear()
  );
}

// Marcos reais do repositório, no lugar de capítulos fixos. Cada navegador vê cada marco
// uma vez, e o aniversário uma vez por ano.
export function pendingMilestones(island, { forks = 0, bottles = 0 } = {}, seen = [], now = new Date()) {
  const reached = [];
  if (island.estrelas >= 1) reached.push('primeiraEstrela');
  if (island.estrelas >= 10) reached.push('dezEstrelas');
  if (island.estrelas >= 100) reached.push('cemEstrelas');
  if (island.principal && forks >= 1) reached.push('primeiroFork');
  if (island.principal && bottles >= 1) reached.push('primeiraGarrafa');
  if (island.commits3d >= 10) reached.push('dezCommits');
  if (isAnniversary(island.criadoEm, now)) reached.push(`aniversario${now.getFullYear()}`);
  return reached.filter((milestone) => !seen.includes(milestone));
}
