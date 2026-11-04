// Distribuição em espiral de girassol (ângulo áureo): cada índice tem posição fixa.
// Um fork novo entra na borda, sem empurrar as ilhas que já existem.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const SPACING_X = 175;
export const SPACING_Y = 105;

export function islandPosition(index) {
  if (index === 0) return { x: 0, y: 0 };
  const radius = Math.sqrt(index + 1);
  const angle = index * GOLDEN_ANGLE;
  return {
    x: Math.round(Math.cos(angle) * radius * SPACING_X),
    y: Math.round(Math.sin(angle) * radius * SPACING_Y),
  };
}

export function worldBounds(positions, margin = 120) {
  const xs = positions.map((position) => position.x);
  const ys = positions.map((position) => position.y);
  return {
    minX: Math.min(...xs) - margin,
    maxX: Math.max(...xs) + margin,
    minY: Math.min(...ys) - margin,
    maxY: Math.max(...ys) + margin,
  };
}
