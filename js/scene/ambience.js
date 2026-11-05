// Clima, maré e decorações de datas comemorativas da cena.

import { isLowTide, holidayOn, tideLevel, weatherAt } from '../calendar.js';
import { islandFront } from './scene-art.js';
import { PROP_POSITIONS } from './scene-art.js';

const REFRESH_SECONDS = 5;
const PENNANT_COLORS = ['#ea7a3a', '#f2c94c', '#57d36b', '#7fd0e8', '#d84f3f'];
const FIREWORK_COLORS = ['#ff6b6b', '#f2c94c', '#7fd0e8', '#57d36b', '#f4ecd8'];

function hash(value) {
  let result = Math.imul(value + 11, 2654435761);
  result ^= result >>> 15;
  return Math.imul(result, 2246822519) >>> 0;
}

export class Ambience {
  constructor(scene, { dateFn, weatherOverride = null, tideOverride = null, holidayOverride = null }) {
    this.scene = scene;
    this.dateFn = dateFn;
    this.weatherOverride = weatherOverride;
    this.tideOverride = tideOverride;
    this.holidayOverride = holidayOverride;
    this.timer = 0;
    this.time = 0;
    this.refresh();
  }

  refresh() {
    const date = this.dateFn();
    this.weather = this.weatherOverride ?? weatherAt(this.scene.seed, date);
    this.holiday = this.holidayOverride ?? holidayOn(date);
    const level = this.tideOverride ?? tideLevel(date);
    this.lowTide = this.tideOverride !== null ? level < 0.3 : isLowTide(date);
    // Maré baixa recua a água e revela até 6 pixels de areia molhada.
    this.tideOffset = Math.round((1 - level) * 6);
  }

  conditions() {
    return {
      rain: this.weather === 'chuva',
      hot: this.weather === 'calor',
      lowTide: this.lowTide,
    };
  }

  update(dt) {
    this.time += dt;
    this.timer += dt;
    if (this.timer >= REFRESH_SECONDS) {
      this.timer = 0;
      this.refresh();
    }
  }

  drawTideBand(g) {
    if (this.tideOffset <= 0) return;
    const { view, seed } = this.scene;
    g.fillStyle = '#9c8458';
    for (let x = -152; x <= 152; x += 2) {
      const y = Math.round(islandFront(x));
      g.fillRect(x - view.left, y - view.top, 2, this.tideOffset);
    }
    if (this.tideOffset < 4) return;
    for (let i = 0; i < 14; i += 1) {
      const code = hash(seed + i);
      const x = -130 + (code % 260);
      const y = Math.round(islandFront(x)) + 1 + ((code >>> 8) % (this.tideOffset - 1));
      g.fillStyle = i % 3 === 0 ? '#fff0e4' : '#ffd9c8';
      g.fillRect(x - view.left, y - view.top, 2, 1);
    }
  }

  drawWeather(g, view) {
    if (this.weather === 'chuva') {
      g.fillStyle = 'rgba(32, 42, 66, 0.26)';
      g.fillRect(0, 0, view.w, view.h);
      for (let i = 0; i < 150; i += 1) {
        const code = hash(i);
        const speed = 220 + (code % 90);
        const x = (code % (view.w + 40)) - Math.floor(this.time * 40) % 40;
        const y = Math.floor(((code >>> 8) % 1000) + this.time * speed) % (view.h + 20);
        g.fillStyle = i % 3 === 0 ? 'rgba(220, 235, 245, 0.5)' : 'rgba(180, 205, 225, 0.35)';
        g.fillRect(x, y, 1, 5);
      }
      for (let i = 0; i < 18; i += 1) {
        const code = hash(i + 500);
        const cycle = (this.time * 0.9 + (code % 100) / 100) % 1;
        const x = (code % view.w);
        const y = -view.top + 60 + ((code >>> 8) % Math.max(1, view.h + view.top - 60));
        g.fillStyle = `rgba(220, 240, 245, ${0.6 * (1 - cycle)})`;
        g.fillRect(x - Math.round(cycle * 4), y, 2 + Math.round(cycle * 8), 1);
      }
    } else if (this.weather === 'calor') {
      g.fillStyle = 'rgba(255, 150, 60, 0.07)';
      g.fillRect(0, 0, view.w, view.h);
    }
  }

  drawFireworks(g, view) {
    const { palette } = this.scene;
    if (!palette || palette.night < 0.3) return;
    if (this.holiday !== 'anoNovo' && this.holiday !== 'independencia') return;
    for (let i = 0; i < 4; i += 1) {
      const period = 3 + i * 0.7;
      const round = Math.floor((this.time + i * 1.1) / period);
      const t = ((this.time + i * 1.1) % period) / period;
      if (t > 0.45) continue;
      const code = hash(round * 31 + i);
      const cx = Math.round(view.w * 0.1 + (code % Math.round(view.w * 0.8)));
      const cy = Math.round(-view.top - 60 - ((code >>> 8) % 70));
      const radius = (t / 0.45) * 24;
      g.globalAlpha = 1 - t / 0.45;
      g.fillStyle = FIREWORK_COLORS[code % FIREWORK_COLORS.length];
      for (let spark = 0; spark < 16; spark += 1) {
        const angle = (spark / 16) * Math.PI * 2;
        g.fillRect(Math.round(cx + Math.cos(angle) * radius), Math.round(cy + Math.sin(angle) * radius), 2, 2);
      }
    }
    g.globalAlpha = 1;
  }

  drawDecorations(g) {
    const { view, palette } = this.scene;
    const { holiday, time } = this;
    if (!holiday) return;
    const toX = (x) => Math.round(x - view.left);
    const toY = (y) => Math.round(y - view.top);
    const rect = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    if (holiday === 'natal') {
      const crown = this.scene.palmCrown();
      for (let i = 0; i < 14; i += 1) {
        const angle = (i / 14) * Math.PI;
        const on = Math.floor(time * 2 + i) % 2 === 0;
        const color = FIREWORK_COLORS[i % 4];
        const x = toX(crown.x + Math.cos(angle) * 28);
        const y = toY(crown.y + Math.sin(angle) * 10 + 2);
        rect(x, y, 2, 2, on ? color : '#3a4a5c');
      }
      const giftX = toX(12);
      const giftY = toY(44);
      rect(giftX, giftY, 14, 11, '#231a2b');
      rect(giftX + 1, giftY + 1, 12, 9, '#d84f3f');
      rect(giftX + 6, giftY + 1, 2, 9, '#f2c94c');
      rect(giftX + 1, giftY + 4, 12, 2, '#f2c94c');
    }
    if (holiday === 'halloween') {
      const x = toX(100);
      const y = toY(-2 + Math.sin(time * 1.4) * 4);
      rect(x - 7, y - 10, 14, 15, '#f4f6ff');
      rect(x - 5, y - 12, 10, 2, '#f4f6ff');
      rect(x - 3, y - 6, 2, 3, '#231a2b');
      rect(x + 2, y - 6, 2, 3, '#231a2b');
      for (let i = -6; i <= 4; i += 4) rect(x + i, y + 5, 2, 2 + (Math.floor(time * 4 + i) & 1), '#f4f6ff');
      if (palette?.night > 0.3) {
        for (let i = 0; i < 3; i += 1) {
          const bx = toX(Math.sin(time * 0.7 + i * 2) * 110);
          const by = toY(-48 - i * 14 + Math.cos(time * 1.2 + i) * 8);
          const up = Math.sin(time * 14 + i) > 0;
          rect(bx - 1, by, 3, 2, '#231a2b');
          rect(bx - 4, by + (up ? -1 : 1), 3, 1, '#231a2b');
          rect(bx + 2, by + (up ? -1 : 1), 3, 1, '#231a2b');
        }
      }
    }
    if (holiday === 'saoPatricio') {
      for (let i = 0; i < 10; i += 1) {
        const code = hash(i + 80);
        const x = toX(-120 + (code % 240));
        const y = toY(36 + ((code >>> 8) % 16));
        rect(x, y, 2, 2, '#3f9e4d');
        rect(x + 2, y, 2, 2, '#57c36a');
        rect(x + 1, y - 2, 2, 2, '#57c36a');
        rect(x + 1, y + 2, 1, 2, '#2f7741');
      }
    }
    if (holiday === 'festaJunina') {
      const from = { x: toX(-96), y: toY(-30) };
      const to = { x: toX(60), y: toY(-8) };
      for (let i = 0; i <= 18; i += 1) {
        const t = i / 18;
        const x = Math.round(from.x + (to.x - from.x) * t);
        const y = Math.round(from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * 16);
        rect(x, y, 3, 1, '#f4ecd8');
        if (i % 2 === 0) {
          const color = PENNANT_COLORS[(i / 2) % PENNANT_COLORS.length];
          for (let row = 0; row < 5; row += 1) rect(x + row, y + 1 + row, Math.max(1, 6 - row * 2), 1, color);
        }
      }
    }
    if (holiday === 'carnaval') {
      for (let i = 0; i < 34; i += 1) {
        const code = hash(i + 200);
        const x = (code % view.w) + Math.round(Math.sin(time + i) * 4);
        const fall = ((code >>> 8) % 300) + time * (18 + (code % 16));
        const y = Math.floor(fall) % Math.max(1, view.h);
        rect(x, y, 2, 2, PENNANT_COLORS[code % PENNANT_COLORS.length]);
      }
    }
    if (holiday === 'independencia') {
      const { x, y } = PROP_POSITIONS.bancada;
      const left = toX(x);
      const top = toY(y - 21);
      rect(left - 1, top, 1, 6, '#f4ecd8');
      rect(left, top, 6, 4, '#d84f3f');
      rect(left, top + 1, 6, 1, '#f4ecd8');
      rect(left, top, 2, 2, '#2e5f8c');
    }
  }

  // Chapéu do náufrago conforme a data.
  drawHat(g, head) {
    const x = Math.round(head.x);
    const y = Math.round(head.y) - 9;
    const rect = (px, py, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x + px, y + py, w, h);
    };
    if (this.holiday === 'natal') {
      rect(-6, -1, 12, 3, '#f4f6ff');
      rect(-5, -5, 10, 4, '#d84f3f');
      rect(-3, -8, 6, 3, '#d84f3f');
      rect(2, -8, 3, 3, '#f4f6ff');
    } else if (this.holiday === 'anoNovo' || this.holiday === 'carnaval') {
      for (let row = 0; row < 9; row += 1) {
        rect(-Math.floor((9 - row) / 2), -row, 9 - row, 1, row % 3 === 0 ? '#f2c94c' : '#d84f3f');
      }
      rect(-1, -10, 2, 2, '#57d36b');
    } else if (this.holiday === 'saoPatricio') {
      rect(-7, 0, 14, 2, '#231a2b');
      rect(-5, -6, 10, 6, '#2f9078');
      rect(-5, -2, 10, 1, '#f2c94c');
    } else if (this.holiday === 'halloween') {
      rect(-7, 0, 14, 2, '#231a2b');
      for (let row = 0; row < 8; row += 1) rect(-Math.floor((8 - row) / 2), -row, 8 - row, 1, '#3a2a55');
    } else if (this.holiday === 'festaJunina') {
      rect(-8, 0, 16, 2, '#d2bb68');
      rect(-4, -4, 8, 4, '#e7d28a');
      rect(-4, -1, 8, 1, '#d84f3f');
    }
  }
}
