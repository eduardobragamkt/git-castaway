// Os dois projetos de longo prazo do náufrago: o jardim e a jangada que nunca fica pronta.

function paint(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

const PLANTS = [
  { x: -88, y: 52 },
  { x: -80, y: 54 },
  { x: -72, y: 52 },
  { x: -64, y: 54 },
  { x: -84, y: 48 },
  { x: -76, y: 49 },
  { x: -68, y: 48 },
];
const FLOWERS = ['#ea6a5a', '#f2c94c', '#f7a8d0', '#7fd0e8', '#f4ecd8', '#ea7a3a', '#c98ef0'];

// Estágios: 1 broto, 2 mais brotos, 3 botões, 4 flores, 5 horta, 6 árvore frutífera.
export function drawGarden(g, view, stage, blooms, time) {
  const toX = (x) => Math.round(x - view.left);
  const toY = (y) => Math.round(y - view.top);
  paint(g, toX(-94), toY(47), 38, 9, '#a98d5b');
  paint(g, toX(-93), toY(48), 36, 7, '#7c5f3c');
  for (let x = -92; x < -58; x += 5) paint(g, toX(x), toY(46), 1, 10, '#6f4a2a');

  const plantCount = Math.min(PLANTS.length, stage === 1 ? 1 : stage + 1);
  PLANTS.slice(0, plantCount).forEach((plant, index) => {
    const x = toX(plant.x);
    const y = toY(plant.y);
    const sway = Math.round(Math.sin(time * 1.5 + index) * 0.6);
    const height = Math.min(9, 2 + stage + (index % 2));
    paint(g, x + sway, y - height, 1, height, '#2f8a43');
    paint(g, x - 2, y - Math.ceil(height / 2), 2, 1, '#3fa64d');
    paint(g, x + 1, y - Math.ceil(height / 2) - 1, 2, 1, '#54b257');
    if (stage >= 3) {
      if (blooms && stage >= 4) {
        const color = FLOWERS[index % FLOWERS.length];
        paint(g, x - 1 + sway, y - height - 2, 3, 3, color);
        paint(g, x + sway, y - height - 1, 1, 1, '#ffe37a');
      } else {
        paint(g, x + sway, y - height - 1, 1, 2, '#6dbb55');
      }
    }
    if (stage >= 5 && index % 2 === 0) paint(g, x + 2, y - 2, 3, 2, '#d84f3f');
  });

  if (stage >= 6) {
    const x = toX(-98);
    const y = toY(51);
    paint(g, x - 2, y - 15, 4, 15, '#3d2a1d');
    paint(g, x - 1, y - 15, 2, 15, '#8a5a35');
    for (let row = -7; row <= 6; row += 1) {
      const half = Math.round(9 * Math.sqrt(1 - (row / 8) ** 2));
      paint(g, x - half, y - 21 + row, half * 2, 1, row < -2 ? '#54b257' : '#2f8a43');
    }
    for (const [dx, dy] of [[-5, -22], [3, -24], [5, -18], [-2, -17]]) {
      paint(g, x + dx, y + dy, 3, 3, '#ea7a3a');
    }
  }
}

// Cada estágio acrescenta partes; a jangada completa só chega ao teste, nunca à viagem.
export function drawRaft(g, view, { x, y, stage, alpha = 1 }) {
  const left = Math.round(x - view.left);
  const bottom = Math.round(y - view.top);
  const logs = [3, 5, 7, 7, 7][stage];
  g.globalAlpha = alpha;
  const start = left - Math.round((logs * 5) / 2);
  for (let i = 0; i < logs; i += 1) {
    paint(g, start + i * 5, bottom - 7, 5, 8, '#3d2a1d');
    paint(g, start + i * 5 + 1, bottom - 6, 3, 6, '#a87338');
    paint(g, start + i * 5 + 1, bottom - 6, 3, 2, '#c9934d');
  }
  if (stage >= 2) paint(g, start + 1, bottom - 4, logs * 5 - 2, 1, '#d9d4c7');
  if (stage >= 3) paint(g, left - 1, bottom - 26, 2, 20, '#54331f');
  if (stage >= 4) {
    paint(g, left + 1, bottom - 25, 14, 13, '#231a2b');
    paint(g, left + 1, bottom - 24, 13, 11, '#f4ecd8');
    paint(g, left + 1, bottom - 15, 13, 2, '#d5cbb3');
    paint(g, left + 5, bottom - 21, 2, 5, '#ea7a3a');
  }
  g.globalAlpha = 1;
}

export function drawRaftWreck(g, view, { x, y, age }) {
  const left = Math.round(x - view.left);
  const bottom = Math.round(y - view.top);
  const settled = Math.min(1, age / 0.5);
  for (const [dx, dy, length] of [[-16, 0, 13], [0, 2, 10], [10, -2, 14], [-6, -3, 8]]) {
    paint(g, left + dx * settled, bottom + dy, length, 3, '#3d2a1d');
    paint(g, left + dx * settled + 1, bottom + dy + 1, length - 2, 1, '#a87338');
  }
}
