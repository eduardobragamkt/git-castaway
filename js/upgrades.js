// Melhorias conquistadas por estrelas. x e y posicionam o item na ilha do mapa,
// como frações dos raios da ilha.
export const STAR_UPGRADES = [
  { stars: 1, sprite: 'caixote', x: 0.42, y: 0.28, pt: 'Caixa de suprimentos', en: 'Supply crate' },
  { stars: 3, sprite: 'barril', x: 0.6, y: 0.02, pt: 'Barril', en: 'Barrel' },
  { stars: 5, sprite: 'fogueira', x: -0.18, y: 0.5, pt: 'Fogueira', en: 'Campfire' },
  { stars: 10, sprite: 'bandeira', x: -0.5, y: -0.28, pt: 'Bandeira', en: 'Flag' },
  { stars: 25, sprite: 'cabana', x: 0.1, y: -0.42, pt: 'Cabana', en: 'Hut' },
  { stars: 50, sprite: 'jangada', x: -1.08, y: 0.85, pt: 'Jangada', en: 'Raft' },
  { stars: 100, sprite: 'farol', x: -0.86, y: -0.35, pt: 'Farol', en: 'Lighthouse' },
];

export function nextUpgrade(stars) {
  return STAR_UPGRADES.find((upgrade) => stars < upgrade.stars) ?? null;
}

export function hasUpgrade(stars, sprite) {
  return STAR_UPGRADES.some((upgrade) => upgrade.sprite === sprite && stars >= upgrade.stars);
}
