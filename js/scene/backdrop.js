// Céu, astros, nuvens, aves e mar da cena. As faixas de cor usam pontilhado (dither)
// para que as transições continuem parecendo pixel art.

import { makeCanvas, seededRandom } from '../map/map-art.js';
import { celestialBody, mixColor } from '../core/time.js';

const TILE_WIDTH = 64;
const SKY_HEIGHT = 320;
const SEA_HEIGHT = 220;
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function hash2(x, y) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

function rgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function buildRamp(colors, steps) {
  return Array.from({ length: steps }, (_, step) => {
    const position = (step / (steps - 1)) * (colors.length - 1);
    const index = Math.min(colors.length - 2, Math.floor(position));
    return rgb(mixColor(colors[index], colors[index + 1], position - index));
  });
}

function buildBandTile(colors, height, steps) {
  const [canvas, g] = makeCanvas(TILE_WIDTH, height);
  const image = g.createImageData(TILE_WIDTH, height);
  const ramp = buildRamp(colors, steps);
  for (let y = 0; y < height; y += 1) {
    const position = (y / (height - 1)) * (steps - 1);
    const base = Math.floor(position);
    const fraction = position - base;
    for (let x = 0; x < TILE_WIDTH; x += 1) {
      const threshold = (BAYER[y % 4][x % 4] + 0.5) / 16;
      const color = ramp[Math.min(steps - 1, fraction > threshold ? base + 1 : base)];
      const offset = (y * TILE_WIDTH + x) * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = 255;
    }
  }
  g.putImageData(image, 0, 0);
  return canvas;
}

function buildCloud(seed, light, shade) {
  const random = seededRandom(seed);
  const [canvas, g] = makeCanvas(96, 34);
  const puffs = 6 + Math.floor(random() * 4);
  const circles = [];
  for (let i = 0; i < puffs; i += 1) {
    const t = (i + 0.5) / puffs;
    const radius = (5 + random() * 8) * Math.sin(Math.PI * t) + 3;
    circles.push({ x: 8 + t * 80, y: 25 - radius * 0.65, radius });
  }
  const inside = (x, y) => circles.some((c) => (x - c.x) ** 2 + ((y - c.y) * 1.2) ** 2 <= c.radius ** 2);
  for (let y = 0; y < 30; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      if (!inside(x, y)) continue;
      const lower = !inside(x, y + 3);
      const dithered = !inside(x, y + 5) && (x + y) % 2 === 0;
      g.fillStyle = lower || dithered ? shade : light;
      g.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export class Backdrop {
  constructor(seed, distantIslets) {
    this.paletteKey = null;
    this.distantIslets = distantIslets;
    const random = seededRandom(seed + 91);
    this.clouds = Array.from({ length: 7 }, (_, i) => ({
      variant: i % 4,
      offset: random() * 1000,
      y: -150 + random() * 112,
      speed: 2 + random() * 3.5,
    }));
    this.isletX = [-340, -228, 236, 348, -470, 482];
    this.shootingStar = null;
  }

  prepare(palette) {
    const key = JSON.stringify(palette);
    if (key === this.paletteKey) return;
    this.paletteKey = key;
    this.skyTile = buildBandTile(palette.sky, SKY_HEIGHT, 18);
    this.seaTile = buildBandTile(palette.sea, SEA_HEIGHT, 12);
    this.cloudSprites = [11, 23, 37, 53].map((seed) => buildCloud(seed, palette.cloud, palette.cloudShade));
  }

  launchShootingStar(view) {
    this.shootingStar = { x: view.left + view.w * 0.2, y: view.top + 20, age: 0 };
  }

  draw(g, view, clock, hour, palette, dt) {
    this.prepare(palette);
    g.fillStyle = palette.sky[0];
    g.fillRect(0, 0, view.w, view.h);

    const startX = Math.floor(view.left / TILE_WIDTH) * TILE_WIDTH;
    for (let x = startX; x < view.left + view.w; x += TILE_WIDTH) {
      g.drawImage(this.skyTile, x - view.left, -SKY_HEIGHT - view.top);
    }

    this.drawStars(g, view, clock, palette);
    this.drawBody(g, view, hour, palette);
    this.drawClouds(g, view, clock);
    this.drawIslets(g, view, palette);
    this.drawBirds(g, view, clock, palette);

    g.fillStyle = palette.sea[1];
    g.fillRect(0, -view.top + SEA_HEIGHT, view.w, Math.max(0, view.h + view.top - SEA_HEIGHT));
    for (let x = startX; x < view.left + view.w; x += TILE_WIDTH) {
      g.drawImage(this.seaTile, x - view.left, -view.top);
    }
    this.drawSunPath(g, view, clock, hour, palette);
    this.drawWaves(g, view, clock, palette);
    this.drawShootingStar(g, view, dt);
  }

  drawStars(g, view, clock, palette) {
    if (palette.night <= 0.05) return;
    const cell = 12;
    const bottom = Math.min(0, view.top + view.h);
    for (let cy = Math.floor(view.top / cell); cy * cell < bottom; cy += 1) {
      for (let cx = Math.floor(view.left / cell); cx * cell < view.left + view.w; cx += 1) {
        const hash = hash2(cx, cy);
        if (hash % 7 !== 0) continue;
        const twinkle = Math.sin(clock * (1 + (hash % 5) * 0.4) + hash) > -0.5;
        if (!twinkle && hash % 3 === 0) continue;
        g.globalAlpha = palette.night * (hash % 2 ? 0.95 : 0.5);
        g.fillStyle = hash % 11 === 0 ? '#ffdca8' : '#f4f6ff';
        g.fillRect(cx * cell + ((hash >>> 8) % cell) - view.left, cy * cell + ((hash >>> 13) % cell) - view.top, 1, 1);
      }
    }
    g.globalAlpha = 1;
  }

  bodyPosition(hour) {
    const body = celestialBody(hour);
    return { ...body, x: -230 + body.t * 460, y: -12 - Math.sin(body.t * Math.PI) * 118 };
  }

  drawBody(g, view, hour, palette) {
    const { kind, x, y } = this.bodyPosition(hour);
    const cx = Math.round(x - view.left);
    const cy = Math.round(y - view.top);
    const disc = (radius, color, alpha = 1) => {
      g.globalAlpha = alpha;
      g.fillStyle = color;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const half = Math.round(Math.sqrt(radius * radius - dy * dy));
        g.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
      }
      g.globalAlpha = 1;
    };
    if (kind === 'sun') {
      disc(20, palette.sun, 0.14);
      disc(15, palette.sun, 0.22);
      disc(11, palette.sun);
      disc(7, mixColor(palette.sun, '#ffffff', 0.55));
    } else {
      disc(15, palette.sun, 0.1);
      disc(9, '#eef0d8');
      g.fillStyle = '#c9cdb8';
      g.fillRect(cx - 4, cy - 3, 3, 2);
      g.fillRect(cx + 2, cy + 2, 2, 2);
      g.fillRect(cx - 2, cy + 4, 2, 1);
    }
  }

  drawClouds(g, view, clock) {
    const range = view.w + 220;
    for (const cloud of this.clouds) {
      const travel = (cloud.offset + clock * cloud.speed) % range;
      g.drawImage(this.cloudSprites[cloud.variant], Math.round(travel - 110), Math.round(cloud.y - view.top));
    }
  }

  drawIslets(g, view, palette) {
    const color = mixColor(palette.sea[0], '#1a2340', 0.45);
    g.fillStyle = color;
    this.isletX.slice(0, this.distantIslets).forEach((x, index) => {
      const width = 22 + (index % 3) * 10;
      const left = x - view.left;
      for (let dx = 0; dx < width; dx += 1) {
        const height = Math.round(Math.sin((dx / width) * Math.PI) * (5 + (index % 2) * 3));
        g.fillRect(left + dx, -view.top - height, 1, height);
      }
    });
  }

  drawBirds(g, view, clock, palette) {
    if (palette.night > 0.5) return;
    const span = view.w + 300;
    const lead = ((clock * 16) % span) + view.left - 150;
    g.fillStyle = mixColor('#23304a', palette.sky[2], 0.15);
    [[0, 0], [-10, 5], [-17, -3]].forEach(([dx, dy], i) => {
      const x = Math.round(lead + dx - view.left);
      const y = Math.round(-92 + dy + Math.sin(clock * 0.8 + i) * 2 - view.top);
      const up = Math.sin(clock * 8 + i * 1.3) > 0;
      g.fillRect(x, y, 1, 1);
      g.fillRect(x - 2, y + (up ? -1 : 1), 2, 1);
      g.fillRect(x + 1, y + (up ? -1 : 1), 2, 1);
    });
  }

  drawSunPath(g, view, clock, hour, palette) {
    const { x, y } = this.bodyPosition(hour);
    const strength = Math.max(0.2, 1 - Math.abs(y + 60) / 130);
    g.fillStyle = palette.sun;
    for (let row = 2; row < 150; row += 3) {
      const hash = hash2(row, Math.floor(clock * 2.6));
      const spread = 8 + row * 0.22;
      const width = 3 + (hash % Math.max(1, Math.round(spread)));
      const dx = ((hash >>> 8) % Math.round(spread * 2)) - spread;
      g.globalAlpha = strength * (0.5 - row / 400);
      g.fillRect(Math.round(x + dx - view.left), row - view.top, width, 1);
    }
    g.globalAlpha = 1;
  }

  drawWaves(g, view, clock, palette) {
    const cellX = 22;
    const cellY = 7;
    const bottom = Math.min(SEA_HEIGHT * 2, view.top + view.h);
    for (let cy = Math.max(0, Math.floor(view.top / cellY)); cy * cellY < bottom; cy += 1) {
      for (let cx = Math.floor(view.left / cellX); cx * cellX < view.left + view.w; cx += 1) {
        const hash = hash2(cx, cy + 300);
        if (hash % 3 !== 0) continue;
        const cycle = (clock * 0.5 + ((hash >>> 4) % 97) / 24) % 2;
        if (cycle > 1.2) continue;
        const depth = Math.min(1, (cy * cellY) / 120);
        const length = Math.round(2 + depth * 8 * Math.sin((cycle / 1.2) * Math.PI));
        if (length < 2) continue;
        g.globalAlpha = 0.35 + depth * 0.5;
        g.fillStyle = palette.cap;
        const x = cx * cellX + ((hash >>> 8) % cellX) + Math.round(cycle * 3);
        g.fillRect(x - view.left, cy * cellY + ((hash >>> 13) % cellY) - view.top, length, 1);
      }
    }
    g.globalAlpha = 1;
  }

  drawShootingStar(g, view, dt) {
    const star = this.shootingStar;
    if (!star) return;
    star.age += dt;
    if (star.age > 0.9) {
      this.shootingStar = null;
      return;
    }
    const x = star.x + star.age * 190;
    const y = star.y + star.age * 55;
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i += 1) {
      g.globalAlpha = (1 - i / 14) * (1 - star.age / 0.9);
      g.fillRect(Math.round(x - i * 2.6 - view.left), Math.round(y - i * 0.75 - view.top), 2, 1);
    }
    g.globalAlpha = 1;
  }
}
