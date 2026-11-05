// Objetivos de longo prazo. Vêm só dos dias na ilha e dos commits públicos, então
// funcionam em qualquer fork, sem guardar nada em servidor.

const GARDEN_THRESHOLDS = [1, 3, 7, 14, 30, 60];
export const RAFT_STAGES = 5;
const DAYS_PER_RAFT_STAGE = 3;

// De 1 (primeiro broto) a 6 (horta com árvore frutífera).
export function gardenStage(days) {
  const safeDays = Number.isFinite(days) && days > 0 ? days : 1;
  return GARDEN_THRESHOLDS.filter((threshold) => safeDays >= threshold).length;
}

export function gardenBlooms(commits) {
  return commits > 0;
}

// A jangada cresce em etapas e recomeça: de 0 (primeiras toras) a 4 (com mastro e vela).
// O ciclo garante que ela nunca fica pronta de verdade.
export function raftStage(days) {
  const safeDays = Number.isFinite(days) && days > 0 ? days : 1;
  return Math.floor((safeDays - 1) / DAYS_PER_RAFT_STAGE) % RAFT_STAGES;
}
