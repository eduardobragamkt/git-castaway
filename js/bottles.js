// Regras das garrafas: quanto tempo ficam na praia e de quanto em quanto tempo são lidas.

export const BOTTLE_LIFETIME_MS = 30 * 60 * 1000;
export const BOTTLE_REREAD_MS = 5 * 60 * 1000;

// A validade conta a partir da abertura da Issue, então a garrafa some para todos ao
// mesmo tempo, mesmo que o workflow só rode de novo horas depois.
export function activeBottles(bottles, now = Date.now()) {
  return bottles.filter((bottle) => {
    const openedAt = Date.parse(bottle.abertaEm);
    return Number.isFinite(openedAt) && now - openedAt < BOTTLE_LIFETIME_MS;
  });
}

export function canReadBottle(lastReadAt, now = Date.now()) {
  return !Number.isFinite(lastReadAt) || now - lastReadAt >= BOTTLE_REREAD_MS || lastReadAt > now;
}
