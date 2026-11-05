// Arte original da ilha em vista lateral, gerada por código.

import { makeCanvas, seededRandom } from '../art.js';

const ISLAND_RX = 152;
const OX = 176;
const OY = 64;

export function islandBack(x) {
  return 48 - 30 * Math.sqrt(Math.max(0, 1 - (x / ISLAND_RX) ** 2));
}

export function islandFront(x) {
  return 48 + 9 * Math.sqrt(Math.max(0, 1 - (x / ISLAND_RX) ** 2));
}

function rockBlob(g, cx, cy, rx, ry, random) {
  for (let y = -ry; y <= ry; y += 1) {
    for (let x = -rx; x <= rx; x += 1) {
      const distance = (x / rx) ** 2 + (y / ry) ** 2;
      if (distance > 1) continue;
      const light = -x / rx - y / ry;
      let color = '#73717f';
      if (light > 0.55) color = '#b3b1bc';
      else if (light > 0.05) color = '#918f9c';
      else if (light < -0.65) color = '#55536a';
      if (random() < 0.05) color = '#5f5d70';
      g.fillStyle = color;
      g.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}

export function buildIsland(seed, big) {
  const random = seededRandom(seed);
  const [canvas, g] = makeCanvas(OX * 2, 130);
  const dot = (x, y, color, w = 1, h = 1) => {
    g.fillStyle = color;
    g.fillRect(Math.round(x + OX), Math.round(y + OY), w, h);
  };
  const duneCenter = -84 + random() * 14 - 7;
  const duneHeight = (big ? 26 : 20) + random() * 7;
  const dune = (x) => duneHeight * Math.exp(-(((x - duneCenter) / 38) ** 2));

  for (let x = -ISLAND_RX; x <= ISLAND_RX; x += 1) {
    const back = islandBack(x);
    const front = islandFront(x);
    const top = Math.round(back - dune(x));
    const slope = dune(x - 2) - dune(x + 2);
    for (let y = top; y <= front; y += 1) {
      let color;
      if (y < back) {
        const litSide = slope > 0;
        color = litSide ? '#fbeab4' : '#e4c780';
        if (Math.abs(slope) < 0.5) color = '#f4dd9f';
        if (!litSide && (x + y) % 2 === 0 && Math.abs(slope) > 1.4) color = '#d3b26f';
      } else {
        const depth = (y - back) / Math.max(1, front - back);
        const dither = (x + y) % 2 === 0 ? 0.04 : -0.04;
        if (depth + dither < 0.44) color = '#f6e3a7';
        else if (depth + dither < 0.68) color = '#eccf8a';
        else if (depth + dither < 0.84) color = '#d6b370';
        else color = '#a58a58';
      }
      dot(x, y, color);
    }
  }

  for (let i = 0; i < 300; i += 1) {
    const x = (random() - 0.5) * ISLAND_RX * 1.75;
    const y = islandBack(x) + random() * (islandFront(x) - islandBack(x)) * 0.8;
    dot(x, y, random() > 0.5 ? '#d9b873' : '#fff3cf');
  }

  for (let i = 0; i < 26; i += 1) {
    const x = duneCenter + (random() - 0.5) * 94;
    const y = islandBack(x) - dune(x) + random() * 7 + 1;
    const height = 3 + Math.floor(random() * 4);
    dot(x, y - height, '#3f8f49', 1, height);
    dot(x + 1, y - height + 1, '#65b55a', 1, height - 1);
    dot(x - 1, y - height + 2, '#2f7741', 1, height - 2);
  }

  const rockX = 92 + Math.round(random() * 8);
  rockBlob(g, OX + rockX + 12, OY + 22, 18, 13, random);
  rockBlob(g, OX + rockX - 7, OY + 26, 13, 10, random);
  rockBlob(g, OX + rockX + 24, OY + 30, 11, 7, random);
  for (let i = 0; i < 18; i += 1) {
    dot(rockX + 2 + random() * 24, 11 + random() * 5, '#4c8c4f', 2, 1);
  }

  for (let y = -3; y <= 3; y += 1) {
    const half = Math.round(13 * Math.sqrt(1 - (y / 3.5) ** 2));
    dot(88 - half, 53 + y - 2, y < 0 ? '#3b9aa8' : '#6fd0cf', half * 2, 1);
  }
  dot(80, 49, '#d9fff6', 3, 1);

  dot(-128, 45, '#6f4c30', 26, 4);
  dot(-128, 45, '#8c6340', 26, 1);
  dot(-122, 42, '#6f4c30', 3, 3);
  dot(-104, 46, '#54391f', 2, 2);

  const star = [[0, 0], [-2, 0], [2, 0], [0, -2], [-1, 2], [1, 2], [0, 1]];
  star.forEach(([x, y]) => dot(66 + x, 51 + y, '#ea6a5a'));
  dot(-16, 53, '#fff0e4', 2, 1);
  dot(-70, 54, '#ffd9c8', 3, 1);
  dot(92, 51, '#fff0e4', 2, 1);

  return { canvas, ox: OX, oy: OY };
}

// Cada folha é um arco com folíolos, e o tronco tem anéis. O sway muda só as folhas.
export function buildPalm(seed, height, sway) {
  const random = seededRandom(seed);
  const [canvas, g] = makeCanvas(150, height + 56);
  const baseX = 75;
  const baseY = height + 55;
  const lean = 12 + random() * 14;
  let topX = baseX;
  let topY = baseY;
  const dot = (x, y, color, w = 1, h = 1) => {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  for (let i = 0; i < height; i += 1) {
    const progress = i / height;
    topX = baseX + lean * progress * progress;
    topY = baseY - i;
    const width = Math.round(7 - progress * 3);
    const left = topX - width / 2;
    const ring = i % 5 < 2;
    dot(left - 1, topY, '#3d2a1d', width + 2, 1);
    dot(left, topY, ring ? '#7f5433' : '#9a6a40', width, 1);
    dot(left + width - 2, topY, ring ? '#5f3d24' : '#744b2d', 2, 1);
    if (!ring) dot(left + 1, topY, '#b5824f');
  }

  const fronds = 10;
  for (let layer = 0; layer < 2; layer += 1) {
    for (let frond = 0; frond < fronds; frond += 1) {
      const side = frond % 2 === 0 ? 1 : -1;
      const spread = (Math.floor(frond / 2) / (fronds / 2)) * 1.25;
      const angle = side > 0 ? -0.35 + spread : Math.PI + 0.35 - spread;
      const length = 36 + random() * 16 - layer * 8;
      const droop = 24 + random() * 8;
      for (let step = 0; step <= 1; step += 0.025) {
        const x = topX + Math.cos(angle + sway * side) * length * step;
        const y = topY + Math.sin(angle) * length * 0.6 * step + droop * step * step;
        const leaf = Math.round((1 - step) * 6) + 1;
        const dark = layer === 0;
        dot(x, y, dark ? '#1f6b3a' : '#2f8a43', 1, leaf + 1);
        dot(x, y, dark ? '#2f8a43' : '#54b257', 1, 1);
        if (!dark && Math.round(step * 40) % 5 === 0) dot(x, y + leaf, '#8bd46e');
      }
    }
  }
  dot(topX - 5, topY + 1, '#3d2a1d', 5, 5);
  dot(topX - 4, topY + 2, '#6f4a2a', 3, 3);
  dot(topX + 1, topY + 2, '#3d2a1d', 5, 5);
  dot(topX + 2, topY + 3, '#7f5433', 3, 3);
  dot(topX - 2, topY + 5, '#3d2a1d', 5, 5);
  dot(topX - 1, topY + 6, '#5f3d24', 3, 3);
  return { canvas, baseX, baseY, topX, topY };
}

function crate() {
  const [c, g] = makeCanvas(24, 22);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(0, 0, 24, 22, '#3d2a1d');
  rect(1, 1, 22, 20, '#a87338');
  for (let y = 1; y < 21; y += 5) rect(1, y, 22, 1, '#8a5a30');
  rect(1, 1, 22, 3, '#c9934d');
  rect(1, 18, 22, 3, '#7c5126');
  rect(1, 1, 3, 20, '#7c5126');
  rect(20, 1, 3, 20, '#7c5126');
  for (let i = 0; i < 16; i += 1) rect(4 + i, 3 + i, 2, 1, '#7c5126');
  return c;
}

function barrel() {
  const [c, g] = makeCanvas(18, 24);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(2, 0, 14, 24, '#3d2a1d');
  rect(0, 3, 18, 18, '#3d2a1d');
  rect(3, 1, 12, 22, '#8a5a30');
  rect(1, 4, 16, 16, '#9b6836');
  rect(4, 4, 3, 16, '#b98347');
  rect(13, 4, 3, 16, '#7c5126');
  rect(1, 5, 16, 2, '#5f5c66');
  rect(1, 17, 16, 2, '#5f5c66');
  return c;
}

function firePit() {
  const [c, g] = makeCanvas(28, 11);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(3, 4, 22, 3, '#54331f');
  rect(6, 2, 16, 3, '#6f452a');
  rect(5, 7, 18, 2, '#3d2a1d');
  [0, 6, 13, 20, 25].forEach((x, i) => {
    rect(x, 7 + (i % 2), 4, 3, '#6b6a78');
    rect(x, 7 + (i % 2), 3, 1, '#a09eaa');
  });
  return c;
}

function flag() {
  const [c, g] = makeCanvas(36, 54);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(2, 0, 3, 54, '#3d2a1d');
  rect(3, 0, 1, 54, '#d9d4c7');
  return c;
}

function hut() {
  const [c, g] = makeCanvas(72, 58);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(9, 24, 54, 34, '#3d2a1d');
  rect(10, 25, 52, 33, '#a87338');
  for (let x = 11; x < 62; x += 6) {
    rect(x, 25, 1, 33, '#8a5a30');
    rect(x + 2, 25, 1, 33, '#bd8a4c');
  }
  rect(29, 35, 15, 23, '#3d2a1d');
  rect(31, 37, 11, 21, '#54331f');
  rect(14, 33, 11, 11, '#3d2a1d');
  rect(47, 33, 11, 11, '#3d2a1d');
  for (let row = 0; row < 28; row += 1) {
    const half = 5 + row * 1.13;
    let color = '#d9c26e';
    if (row % 5 === 0) color = '#b39b52';
    else if (row % 5 === 2) color = '#e7d28a';
    rect(Math.round(36 - half), row, Math.round(half * 2), 1, color);
    rect(Math.round(36 - half) - 1, row, 1, 1, '#3d2a1d');
    rect(Math.round(36 + half), row, 1, 1, '#3d2a1d');
  }
  for (let x = 4; x < 68; x += 4) rect(x, 28, 2, 2 + (x % 3), '#b39b52');
  return c;
}

function lighthouse() {
  const [c, g] = makeCanvas(30, 92);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(13, 0, 4, 4, '#d84f3f');
  rect(8, 4, 14, 4, '#d84f3f');
  rect(9, 8, 12, 11, '#3a3a48');
  rect(10, 9, 10, 9, '#f8d866');
  rect(5, 19, 20, 3, '#3a3a48');
  for (let y = 22; y < 92; y += 1) {
    const half = 7 + (y - 22) * 0.07;
    const band = Math.floor((y - 22) / 14) % 2 === 0;
    const left = Math.round(15 - half);
    const width = Math.round(half * 2);
    rect(left - 1, y, width + 2, 1, '#3d2a1d');
    rect(left, y, width, 1, band ? '#f4ecd8' : '#d84f3f');
    rect(left + width - 3, y, 3, 1, band ? '#cfc6b0' : '#a93a2f');
  }
  rect(12, 78, 7, 14, '#3d2a1d');
  rect(13, 44, 5, 6, '#3d2a1d');
  return c;
}

function workbench() {
  const [c, g] = makeCanvas(32, 17);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(0, 0, 32, 5, '#3d2a1d');
  rect(1, 1, 30, 3, '#b98347');
  rect(3, 5, 4, 12, '#54331f');
  rect(25, 5, 4, 12, '#54331f');
  rect(6, 8, 22, 3, '#7f5433');
  rect(13, 0, 6, 1, '#d9d4c7');
  return c;
}

function commitSign() {
  const [c, g] = makeCanvas(38, 30);
  const rect = (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  rect(5, 18, 3, 12, '#54331f');
  rect(30, 18, 3, 12, '#54331f');
  rect(0, 0, 38, 21, '#3d2a1d');
  rect(1, 1, 36, 19, '#7f5433');
  rect(1, 1, 36, 2, '#9a6a40');
  return c;
}

export function buildProps() {
  return {
    caixote: crate(),
    barril: barrel(),
    fogueira: firePit(),
    bandeira: flag(),
    cabana: hut(),
    farol: lighthouse(),
    bancada: workbench(),
    quadro: commitSign(),
  };
}

// Posição de cada objeto na cena: x, y dos pés do sprite no mundo.
export const PROP_POSITIONS = {
  caixote: { x: 70, y: 40 },
  barril: { x: 92, y: 34 },
  fogueira: { x: -16, y: 53 },
  bandeira: { x: -122, y: 26 },
  cabana: { x: 34, y: 29 },
  farol: { x: 124, y: 21 },
  bancada: { x: -60, y: 45 },
  quadro: { x: -22, y: 32 },
};
