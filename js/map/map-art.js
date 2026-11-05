// Toda a arte é gerada aqui, em canvases pequenos que depois são ampliados sem suavização.

import { FRAMES, PALETTE } from './sprite-data.js';

export const VARIANTS = 6;

export function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return [canvas, canvas.getContext('2d')];
}

function dot(g, x, y, color, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

const characterCache = new Map();

export function characterSprite(name, flipped) {
  const key = `${name}:${flipped}`;
  if (characterCache.has(key)) return characterCache.get(key);
  const rows = FRAMES[name];
  const [canvas, g] = makeCanvas(rows[0].length, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((code, x) => {
      if (code === '.') return;
      dot(g, flipped ? row.length - 1 - x : x, y, PALETTE[code]);
    });
  });
  characterCache.set(key, canvas);
  return canvas;
}

function buildWater(rx, ry) {
  const padX = 16;
  const padY = 10;
  const [canvas, g] = makeCanvas((rx + padX) * 2, (ry + padY) * 2);
  for (let y = -(ry + padY); y < ry + padY; y += 1) {
    for (let x = -(rx + padX); x < rx + padX; x += 1) {
      const distance = (x / (rx + padX)) ** 2 + (y / (ry + padY)) ** 2;
      if (distance >= 1) continue;
      if (distance > 0.78 && (x + y) % 2 !== 0) continue;
      dot(g, x + rx + padX, y + ry + padY, distance < 0.72 ? '#55c9c4' : '#3aa8b4');
    }
  }
  return canvas;
}

function buildSand(rx, ry, seed) {
  const random = seededRandom(seed);
  const [canvas, g] = makeCanvas(rx * 2 + 8, ry * 2 + 6);
  const centerX = rx + 4;
  const centerY = ry + 3;
  let wobble = 0;
  for (let y = -ry; y <= ry; y += 1) {
    wobble = Math.max(-2, Math.min(2, wobble + (random() - 0.5) * 1.6));
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) + wobble);
    const shade = (y + ry) / (ry * 2);
    let color = '#f6e2a4';
    if (shade > 0.92) color = '#a98d5b';
    else if (shade > 0.78) color = '#d6b36e';
    else if (shade > 0.42) color = '#ebcf88';
    dot(g, centerX - half, centerY + y, color, half * 2, 1);
  }

  for (let i = 0; i < rx * 2; i += 1) {
    const x = (random() - 0.5) * rx * 1.5;
    const y = (random() - 0.5) * ry * 1.4;
    dot(g, centerX + x, centerY + y, random() > 0.5 ? '#d8b873' : '#fbeec4');
  }

  for (let i = 0; i < 5 + rx / 10; i += 1) {
    const x = centerX + (random() - 0.5) * rx * 1.3;
    const y = centerY - ry * (0.15 + random() * 0.5);
    dot(g, x, y, '#4f9a45', 1, 2);
    dot(g, x + 1, y - 1, '#6dbb55', 1, 3);
    dot(g, x + 2, y, '#4f9a45', 1, 2);
  }

  const rockX = centerX - rx * 0.62;
  const rockY = centerY + ry * 0.05;
  dot(g, rockX, rockY + 2, '#6b6a78', 10, 4);
  dot(g, rockX + 1, rockY, '#8c8b98', 7, 3);
  dot(g, rockX + 2, rockY, '#b0afba', 3, 1);
  return canvas;
}

function buildPalm(seed, height, sway) {
  const random = seededRandom(seed);
  const [canvas, g] = makeCanvas(84, height + 26);
  const baseX = 42;
  const baseY = height + 25;
  const lean = 7 + random() * 12 * (random() > 0.5 ? 1 : -1);
  let topX = baseX;
  let topY = baseY;
  for (let i = 0; i < height; i += 1) {
    const progress = i / height;
    topX = baseX + lean * progress * progress;
    topY = baseY - i;
    const color = i % 4 < 2 ? '#8a5a35' : '#6f452a';
    dot(g, topX - 1, topY, color, progress > 0.7 ? 2 : 3, 1);
    dot(g, topX + (progress > 0.7 ? 1 : 2), topY, '#54331f');
  }
  for (let frond = 0; frond < 8; frond += 1) {
    const angle = (frond / 8) * Math.PI * 2 + 0.2 + sway;
    const length = 21 + random() * 7;
    for (let step = 0; step <= 1; step += 0.035) {
      const x = topX + Math.cos(angle) * length * step;
      const y = topY + Math.sin(angle) * length * step * 0.55 + 12 * step * step;
      dot(g, x, y, frond % 2 ? '#2f8a43' : '#3fa64d');
      if (Math.round(step * 28) % 3 === 0) dot(g, x, y + 1, '#1f6b3a', 1, 2);
    }
  }
  dot(g, topX - 2, topY + 2, '#5a3a22', 2, 2);
  dot(g, topX + 1, topY + 3, '#6f4a2a', 2, 2);
  return { canvas, baseX, baseY };
}

const islandArtCache = new Map();

export function islandArt(variant, big) {
  const key = `${variant}:${big}`;
  if (islandArtCache.has(key)) return islandArtCache.get(key);
  const rx = big ? 74 : 54 + variant * 2;
  const ry = big ? 25 : 18 + (variant % 3);
  const seed = 1009 * (variant + 1) + (big ? 77 : 0);
  const art = {
    rx,
    ry,
    water: buildWater(rx, ry),
    sand: buildSand(rx, ry, seed),
    palms: [
      {
        x: -Math.round(rx * 0.22),
        y: -Math.round(ry * 0.3),
        frames: [buildPalm(seed + 1, 42, 0), buildPalm(seed + 1, 42, 0.07)],
      },
    ],
  };
  if (big) {
    art.palms.push({
      x: Math.round(rx * 0.38),
      y: -Math.round(ry * 0.5),
      frames: [buildPalm(seed + 2, 30, 0.1), buildPalm(seed + 2, 30, 0.17)],
    });
  }
  islandArtCache.set(key, art);
  return art;
}

function crate() {
  const [canvas, g] = makeCanvas(12, 11);
  dot(g, 0, 0, '#a87338', 12, 11);
  dot(g, 0, 0, '#c9934d', 12, 2);
  dot(g, 0, 9, '#7c5126', 12, 2);
  dot(g, 0, 0, '#7c5126', 1, 11);
  dot(g, 11, 0, '#7c5126', 1, 11);
  for (let i = 1; i < 10; i += 1) dot(g, i + 1, i, '#7c5126');
  return canvas;
}

function barrel() {
  const [canvas, g] = makeCanvas(9, 12);
  dot(g, 1, 0, '#8a5a30', 7, 12);
  dot(g, 0, 2, '#9b6836', 9, 8);
  dot(g, 2, 2, '#b98347', 2, 8);
  dot(g, 0, 2, '#5f5c66', 9, 1);
  dot(g, 0, 8, '#5f5c66', 9, 1);
  return canvas;
}

function campfire() {
  const [canvas, g] = makeCanvas(13, 7);
  dot(g, 1, 4, '#6f452a', 11, 2);
  dot(g, 3, 5, '#54331f', 7, 2);
  dot(g, 0, 6, '#8c8b98', 2, 1);
  dot(g, 11, 6, '#8c8b98', 2, 1);
  return canvas;
}

function flag() {
  const [canvas, g] = makeCanvas(19, 26);
  dot(g, 1, 0, '#d9d4c7', 2, 26);
  dot(g, 3, 1, '#ea7a3a', 15, 11);
  dot(g, 3, 10, '#c95f2a', 15, 2);
  dot(g, 7, 3, '#f4ecd8', 1, 7);
  dot(g, 6, 2, '#f4ecd8', 3, 2);
  dot(g, 6, 9, '#f4ecd8', 3, 2);
  dot(g, 8, 5, '#f4ecd8', 4, 1);
  dot(g, 12, 3, '#f4ecd8', 1, 3);
  dot(g, 11, 2, '#f4ecd8', 3, 2);
  return canvas;
}

function hut() {
  const [canvas, g] = makeCanvas(34, 27);
  dot(g, 5, 12, '#a87338', 24, 15);
  for (let x = 6; x < 29; x += 4) dot(g, x, 12, '#8a5a30', 1, 15);
  dot(g, 14, 17, '#3d2a1d', 7, 10);
  dot(g, 7, 15, '#3d2a1d', 4, 4);
  dot(g, 24, 15, '#3d2a1d', 4, 4);
  for (let row = 0; row < 13; row += 1) {
    const half = 3 + row * 1.35;
    dot(g, 17 - half, row, row % 3 === 0 ? '#b8a255' : '#d2bb68', Math.round(half * 2), 1);
  }
  return canvas;
}

function lighthouse() {
  const [canvas, g] = makeCanvas(16, 42);
  dot(g, 7, 0, '#d84f3f', 2, 2);
  dot(g, 4, 2, '#d84f3f', 8, 2);
  dot(g, 5, 4, '#f8d866', 6, 4);
  dot(g, 3, 8, '#3a3a48', 10, 2);
  for (let y = 10; y < 42; y += 1) {
    const half = 3 + (y - 10) * 0.08;
    const band = Math.floor((y - 10) / 7) % 2 === 0;
    dot(g, 8 - half, y, band ? '#f4ecd8' : '#d84f3f', Math.round(half * 2), 1);
  }
  dot(g, 7, 34, '#3d2a1d', 3, 8);
  return canvas;
}

let decorationCache = null;

export function decorationSprites() {
  decorationCache ??= {
    crate: crate(),
    barrel: barrel(),
    campfire: campfire(),
    flag: flag(),
    hut: hut(),
    lighthouse: lighthouse(),
  };
  return decorationCache;
}

export function drawLine(ctx, S, x0, y0, x1, y1, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  ctx.fillStyle = color;
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps);
    const y = Math.round(y0 + ((y1 - y0) * i) / steps);
    ctx.fillRect(x * S, y * S, S, S);
  }
}
