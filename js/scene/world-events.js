// Tudo o que acontece na ilha além do náufrago: visitantes, bichos, objetos que caem,
// fumaça e comemorações. A arte é original e desenhada em retângulos de pixel.

import { PROP_POSITIONS } from './scene-art.js';

const FONT = {
  G: ['111', '100', '101', '101', '111'],
  I: ['111', '010', '010', '010', '111'],
  T: ['111', '010', '010', '010', '010'],
  P: ['111', '101', '111', '100', '100'],
  U: ['101', '101', '101', '101', '111'],
  S: ['111', '100', '111', '001', '111'],
  H: ['101', '101', '111', '101', '101'],
  O: ['111', '101', '101', '101', '111'],
};
const CONFETTI_COLORS = ['#ea7a3a', '#f2c94c', '#57d36b', '#7fd0e8', '#f4ecd8', '#d84f3f'];
const SHELL_COLORS = ['#fff0e4', '#ffd9c8', '#f4dfa6'];

function paint(g, x, y, w, h, color) {
  g.fillStyle = color;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawText(g, text, x, y, scale, color) {
  let cursor = x;
  for (const letter of text) {
    const rows = FONT[letter];
    if (rows) {
      rows.forEach((row, rowIndex) => {
        [...row].forEach((bit, column) => {
          if (bit === '1') paint(g, cursor + column * scale, y + rowIndex * scale, scale, scale, color);
        });
      });
    }
    cursor += 4 * scale;
  }
}

export function paintCrab(g, x, y, time) {
  const step = Math.floor(time * 12) % 2;
  paint(g, x - 6, y - 5, 12, 6, '#231a2b');
  paint(g, x - 5, y - 4, 10, 4, '#d84f3f');
  paint(g, x - 4, y - 4, 8, 1, '#ef7a62');
  paint(g, x - 3, y - 7, 1, 2, '#231a2b');
  paint(g, x + 2, y - 7, 1, 2, '#231a2b');
  paint(g, x - 4, y - 8, 2, 2, '#f4ecd8');
  paint(g, x + 2, y - 8, 2, 2, '#f4ecd8');
  paint(g, x - 9, y - 5 - step, 3, 3, '#d84f3f');
  paint(g, x + 6, y - 5 - (1 - step), 3, 3, '#d84f3f');
  for (const offset of [-5, -2, 1, 4]) paint(g, x + offset, y + 1, 1, 1 + ((offset + step) & 1), '#a93a2f');
}

export function paintGull(g, x, y, time, flying = true) {
  const up = Math.sin(time * 16) > 0;
  paint(g, x - 7, y - 2, 14, 6, '#231a2b');
  paint(g, x - 6, y - 1, 12, 4, '#f4f6ff');
  paint(g, x + 6, y, 3, 2, '#ea9a3a');
  paint(g, x + 4, y - 1, 1, 1, '#231a2b');
  if (!flying) {
    paint(g, x - 2, y + 4, 1, 2, '#ea9a3a');
    paint(g, x + 2, y + 4, 1, 2, '#ea9a3a');
    return;
  }
  if (up) {
    paint(g, x - 5, y - 7, 9, 5, '#231a2b');
    paint(g, x - 4, y - 6, 7, 4, '#c7d3e4');
  } else {
    paint(g, x - 5, y + 2, 9, 5, '#231a2b');
    paint(g, x - 4, y + 3, 7, 3, '#c7d3e4');
  }
}

export class WorldEvents {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.bugs = [];
    this.splats = [];
    this.conflict = null;
    this.fin = null;
    this.smoke = [];
    this.sparks = 0;
    this.tempFire = 0;
    this.benchDown = 0;
    this.boardPainted = false;
    this.sosLetters = 0;
    this.sosFade = 0;
    this.bottleFlight = null;
    this.spit = null;
    this.squirt = null;
    this.splashes = [];
    this.banana = 0;
    this.confetti = [];
    this.visitors = [];
    this.perch = null;
    this.parcel = null;
    this.plank = 0;
    this.shells = [];
  }

  actorHead() {
    const { actor } = this.scene;
    return { x: actor.x, y: actor.y - actor.lift - 42 };
  }

  handle(event) {
    const { actor } = this.scene;
    if (event.startsWith('visitor:')) {
      this.addVisitor(event.slice(8));
      return;
    }
    switch (event) {
      case 'bugsSpawn':
        this.bugs = Array.from({ length: 6 }, (_, i) => ({
          x: actor.x + 8 + i * 8,
          y: actor.y + (i % 3) * 2 - 2,
          phase: i * 1.7,
          fleeing: false,
        }));
        break;
      case 'bugSquash': {
        const bug = this.bugs.shift();
        if (bug) this.splats.push({ x: bug.x, y: bug.y, age: 0 });
        break;
      }
      case 'bugsFlee':
        this.bugs.forEach((bug) => {
          bug.fleeing = true;
        });
        break;
      case 'conflictStart':
        this.conflict = { x: actor.x + 34, y: actor.y + 5, time: 0, resolved: false };
        break;
      case 'conflictEnd':
        if (this.conflict) this.conflict.resolved = true;
        break;
      case 'fin':
        this.fin = { x: 240 };
        break;
      case 'plankFall':
        this.plank = 1;
        break;
      case 'benchCollapse':
        this.benchDown = 8;
        break;
      case 'paintBoard':
        this.boardPainted = true;
        break;
      case 'gullPerch':
        this.startGull('head');
        break;
      case 'gullBath':
        this.startGull('pool');
        break;
      case 'gullToBoard':
        if (this.perch) {
          this.perch.mode = 'board';
          this.perch.stayFor = 14;
        }
        break;
      case 'gullLeave':
        if (this.perch) this.perch.leaving = true;
        break;
      case 'splash':
        this.splashes.push({ x: actor.x, y: actor.y, age: 0 });
        break;
      case 'smoke':
      case 'spark':
        this.puffSmoke(event === 'spark' ? 2 : 6);
        if (event === 'spark') this.sparks = 0.8;
        break;
      case 'fireLit':
        this.tempFire = 11;
        break;
      case 'sosLetter':
        this.sosLetters = Math.min(3, this.sosLetters + 1);
        break;
      case 'sosWave':
        this.scene.wave = { x: 24, time: 0 };
        this.sosFade = 0.7;
        break;
      case 'throwBottle':
        this.bottleFlight = { fromX: actor.x, fromY: actor.y - 30, time: 0 };
        break;
      case 'spit':
        this.spit = { time: 0, fromX: actor.x + 44, fromY: 66 };
        break;
      case 'squirt':
        this.squirt = { time: 0, fromX: 88, fromY: 50 };
        break;
      case 'shell':
        this.shells.push({ age: 0, x: actor.x, y: actor.y });
        break;
      case 'banana':
        this.banana = 7;
        break;
      case 'confetti':
        this.launchConfetti();
        break;
      default:
    }
  }

  startGull(mode) {
    const { view } = this.scene;
    this.perch = { mode, x: view.left - 24, y: -120, stayFor: 30, leaving: false };
  }

  puffSmoke(count) {
    const { x, y } = PROP_POSITIONS.fogueira;
    for (let i = 0; i < count; i += 1) {
      this.smoke.push({ x: x + (i - count / 2) * 2, y: y - 8, age: -i * 0.18 });
    }
  }

  launchConfetti() {
    const { actor } = this.scene;
    this.confetti = Array.from({ length: 70 }, (_, i) => ({
      x: actor.x + (i % 7) * 3 - 9,
      y: actor.y - 46,
      vx: Math.cos(i * 2.399) * (20 + (i % 9) * 6),
      vy: -40 - (i % 11) * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      age: 0,
    }));
  }

  addVisitor(type) {
    if (this.visitors.some((visitor) => visitor.type === type)) return;
    const { view } = this.scene;
    const left = view.left;
    const right = view.left + view.w;
    const starts = {
      aviao: { x: left - 110, y: -96 },
      balao: { x: left - 20, y: -92, dropped: false },
      golfinhos: { x: right + 30, y: 82 },
      tartaruga: { x: 136, y: 62, age: 0 },
      baleia: { x: left + view.w * 0.8, y: 6, age: 0 },
      revoada: { x: left - 90, y: -112 },
    };
    this.visitors.push({ type, ...starts[type] });
  }

  update(dt) {
    this.time += dt;
    const { view } = this.scene;
    const right = view.left + view.w;
    const left = view.left;

    this.bugs.forEach((bug) => {
      if (bug.fleeing) {
        bug.x += 70 * dt;
      } else {
        bug.x += Math.sin(this.time * 3 + bug.phase) * 12 * dt;
        bug.y += Math.cos(this.time * 2 + bug.phase) * 3 * dt;
      }
    });
    this.bugs = this.bugs.filter((bug) => bug.x < 158);
    this.splats.forEach((splat) => {
      splat.age += dt;
    });
    this.splats = this.splats.filter((splat) => splat.age < 4);

    if (this.conflict) {
      this.conflict.time += dt;
      if (this.conflict.resolved) {
        this.conflict.spread = (this.conflict.spread ?? 0) + 34 * dt;
        if (this.conflict.spread > 160) this.conflict = null;
      }
    }
    if (this.fin) {
      this.fin.x -= 75 * dt;
      if (this.fin.x < -260) this.fin = null;
    }
    if (this.plank > 0) this.plank = Math.max(0, this.plank - dt * 2.4);
    this.benchDown = Math.max(0, this.benchDown - dt);
    this.sparks = Math.max(0, this.sparks - dt);
    this.tempFire = Math.max(0, this.tempFire - dt);
    this.banana = Math.max(0, this.banana - dt);

    this.smoke.forEach((puff) => {
      puff.age += dt;
    });
    this.smoke = this.smoke.filter((puff) => puff.age < 1.8);

    if (this.sosFade > 0) {
      this.sosFade -= dt;
      if (this.sosFade <= 0) this.sosLetters = 0;
    }

    if (this.bottleFlight) {
      this.bottleFlight.time += dt;
      if (this.bottleFlight.time >= 1.1) {
        this.splashes.push({ x: this.bottleFlight.fromX - 34, y: 62, age: 0 });
        this.bottleFlight = null;
      }
    }
    for (const key of ['spit', 'squirt']) {
      if (this[key]) {
        this[key].time += dt;
        if (this[key].time >= 0.5) this[key] = null;
      }
    }
    this.splashes.forEach((splash) => {
      splash.age += dt;
    });
    this.splashes = this.splashes.filter((splash) => splash.age < 1);
    this.shells.forEach((shell) => {
      shell.age += dt;
    });
    this.shells = this.shells.filter((shell) => shell.age < 1);

    this.confetti.forEach((piece) => {
      piece.age += dt;
      piece.vy += 45 * dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
    });
    this.confetti = this.confetti.filter((piece) => piece.age < 3.4);

    this.updatePerch(dt);
    this.updateVisitors(dt, left, right);
  }

  updatePerch(dt) {
    const { perch } = this;
    if (!perch) return;
    if (perch.leaving || perch.stayFor <= 0) {
      perch.x += 130 * dt;
      perch.y -= 65 * dt;
      if (perch.y < this.scene.view.top - 40) this.perch = null;
      return;
    }
    perch.stayFor -= dt;
    let target;
    if (perch.mode === 'head') {
      const head = this.actorHead();
      target = { x: head.x, y: head.y - 11 };
    } else if (perch.mode === 'pool') {
      target = { x: 88, y: 46 };
    } else {
      const { x, y } = PROP_POSITIONS.quadro;
      target = { x, y: y - 36 };
    }
    const distance = Math.hypot(target.x - perch.x, target.y - perch.y);
    const travel = 170 * dt;
    if (distance <= travel) {
      perch.x = target.x;
      perch.y = target.y;
      perch.landed = true;
    } else {
      perch.x += ((target.x - perch.x) / distance) * travel;
      perch.y += ((target.y - perch.y) / distance) * travel;
      perch.landed = false;
    }
  }

  updateVisitors(dt, left, right) {
    for (const visitor of this.visitors) {
      switch (visitor.type) {
        case 'aviao':
          visitor.x += 72 * dt;
          break;
        case 'balao':
          visitor.x += 34 * dt;
          if (!visitor.dropped && visitor.x > 20) {
            visitor.dropped = true;
            this.parcel = { x: visitor.x, y: visitor.y + 24, age: 0 };
          }
          break;
        case 'golfinhos':
          visitor.x -= 68 * dt;
          break;
        case 'tartaruga':
          visitor.age += dt;
          if (visitor.age < 6) {
            visitor.x -= 11 * dt;
            visitor.y -= 1.6 * dt;
          } else if (visitor.age > 10) {
            visitor.x += 11 * dt;
            visitor.y += 1.6 * dt;
          }
          break;
        case 'baleia':
          visitor.age += dt;
          break;
        case 'revoada':
          visitor.x += 48 * dt;
          break;
        default:
      }
    }
    this.visitors = this.visitors.filter((visitor) => {
      if (visitor.type === 'aviao' || visitor.type === 'balao' || visitor.type === 'revoada') {
        return visitor.x < right + 130;
      }
      if (visitor.type === 'golfinhos') return visitor.x > left - 100;
      return visitor.age < (visitor.type === 'baleia' ? 7 : 16);
    });
    if (this.parcel) {
      this.parcel.age += dt;
      this.parcel.y = Math.min(44, this.parcel.y + 42 * dt);
      if (this.parcel.age > 12) this.parcel = null;
    }
  }

  // Fica atrás da ilha: céu e horizonte.
  drawBack(g) {
    const { view } = this.scene;
    for (const visitor of this.visitors) {
      const x = Math.round(visitor.x - view.left);
      const y = Math.round(visitor.y - view.top);
      if (visitor.type === 'aviao') this.drawPlane(g, x, y);
      if (visitor.type === 'balao') this.drawBalloon(g, x, y + Math.round(Math.sin(this.time) * 3));
      if (visitor.type === 'revoada') this.drawFlock(g, x, y);
      if (visitor.type === 'baleia') this.drawWhale(g, x, y, visitor.age);
    }
  }

  drawPlane(g, x, y) {
    paint(g, x, y, 22, 6, '#231a2b');
    paint(g, x + 1, y + 1, 20, 4, '#d84f3f');
    paint(g, x + 15, y + 1, 4, 2, '#8dd3e8');
    paint(g, x + 22, y - 1, 1, 8, Math.sin(this.time * 40) > 0 ? '#231a2b' : '#c7d3e4');
    paint(g, x + 7, y - 3, 8, 3, '#a93a2f');
    paint(g, x + 7, y + 5, 8, 3, '#a93a2f');
    paint(g, x, y - 4, 3, 4, '#a93a2f');
    paint(g, x - 12, y + 2, 12, 1, '#f4ecd8');
    const wave = Math.round(Math.sin(this.time * 6));
    paint(g, x - 54, y - 3 + wave, 42, 11, '#231a2b');
    paint(g, x - 53, y - 2 + wave, 40, 9, '#f4ecd8');
    drawText(g, 'GIT PUSH', x - 51, y + wave, 1, '#2e5f8c');
  }

  drawBalloon(g, x, y) {
    const stripes = ['#ea7a3a', '#f2c94c', '#2e9078'];
    for (let dy = -15; dy <= 15; dy += 1) {
      const half = Math.round(Math.sqrt(225 - dy * dy));
      for (let dx = -half; dx < half; dx += 1) {
        g.fillStyle = stripes[Math.abs(Math.floor(dx / 5)) % stripes.length];
        g.fillRect(x + dx, y + dy, 1, 1);
      }
    }
    paint(g, x - 6, y + 15, 1, 8, '#54331f');
    paint(g, x + 5, y + 15, 1, 8, '#54331f');
    paint(g, x - 6, y + 23, 12, 6, '#231a2b');
    paint(g, x - 5, y + 24, 10, 4, '#a87338');
  }

  drawFlock(g, x, y) {
    const up = Math.sin(this.time * 9) > 0;
    g.fillStyle = '#23304a';
    for (let i = 0; i < 9; i += 1) {
      const row = Math.ceil(i / 2);
      const side = i % 2 === 0 ? 1 : -1;
      const px = x - row * 9;
      const py = y + row * 4 * side;
      g.fillRect(px, py, 1, 1);
      g.fillRect(px - 2, py + (up ? -1 : 1), 2, 1);
      g.fillRect(px + 1, py + (up ? -1 : 1), 2, 1);
    }
  }

  drawWhale(g, x, y, age) {
    const rise = Math.sin(Math.min(1, age / 7) * Math.PI);
    const height = Math.round(rise * 9);
    g.fillStyle = '#26415f';
    for (let dx = -18; dx <= 18; dx += 1) {
      const columnHeight = Math.round((1 - (dx / 18) ** 2) * height);
      g.fillRect(x + dx, y - columnHeight, 1, columnHeight);
    }
    if (rise > 0.6) {
      const jet = Math.round((rise - 0.6) * 40);
      paint(g, x, y - height - jet, 1, jet, '#d5f4f2');
      paint(g, x - 3, y - height - jet, 7, 1, '#d5f4f2');
    }
  }

  // Fica à frente da areia e do mar, sempre com a mesma luz da ilha.
  drawFront(g) {
    const { view, actor } = this.scene;
    const toX = (x) => Math.round(x - view.left);
    const toY = (y) => Math.round(y - view.top);

    if (this.sosLetters > 0) {
      g.globalAlpha = this.sosFade > 0 ? Math.max(0, this.sosFade / 0.7) : 1;
      drawText(g, 'SOS'.slice(0, this.sosLetters), toX(10), toY(47), 2, '#a98d5b');
      g.globalAlpha = 1;
    }
    for (const splat of this.splats) {
      paint(g, toX(splat.x) - 2, toY(splat.y), 5, 1, '#3f8f49');
      paint(g, toX(splat.x) - 1, toY(splat.y) - 1, 3, 1, '#2f7741');
    }
    for (const bug of this.bugs) {
      const x = toX(bug.x);
      const y = toY(bug.y);
      paint(g, x - 2, y - 2, 5, 3, '#231a2b');
      paint(g, x - 1, y - 2, 3, 2, '#57d36b');
      const leg = Math.floor(this.time * 14) % 2;
      paint(g, x - 2, y + 1, 1, 1 + leg, '#231a2b');
      paint(g, x + 2, y + 1, 1, 2 - leg, '#231a2b');
    }
    if (this.conflict) this.drawConflict(g, toX, toY);
    if (this.fin) this.drawFin(g, toX(this.fin.x), toY(72));
    if (this.tempFire > 0) this.drawTempFire(g, toX, toY);
    if (this.sparks > 0) {
      for (let i = 0; i < 4; i += 1) {
        const { x, y } = PROP_POSITIONS.fogueira;
        paint(g, toX(x + Math.sin(this.time * 19 + i) * 7), toY(y - 7 - i * 2), 1, 1, '#ffe37a');
      }
    }
    for (const puff of this.smoke) {
      if (puff.age < 0) continue;
      g.globalAlpha = Math.max(0, 0.7 - puff.age / 2.6);
      const size = 3 + Math.round(puff.age * 3);
      paint(g, toX(puff.x + Math.sin(puff.age * 3) * 3), toY(puff.y - puff.age * 22), size, size, '#c7cdd4');
    }
    g.globalAlpha = 1;
    if (this.plank > 0) {
      const fall = 1 - this.plank;
      paint(g, toX(actor.x) - 11, toY(actor.y - 30 + fall * 28), 22, 3, '#a87338');
    }
    if (this.bottleFlight) {
      const t = this.bottleFlight.time / 1.1;
      const x = this.bottleFlight.fromX - 34 * t;
      const y = this.bottleFlight.fromY + (62 - this.bottleFlight.fromY) * t - Math.sin(t * Math.PI) * 26;
      paint(g, toX(x) - 3, toY(y) - 1, 7, 3, '#5fbf8f');
    }
    this.drawDroplets(g, this.spit, '#d5f4f2', toX, toY);
    this.drawDroplets(g, this.squirt, '#231a2b', toX, toY);
    for (const splash of this.splashes) {
      const spread = Math.round(splash.age * 22);
      g.fillStyle = '#d5f4f2';
      for (const dir of [-1, 1]) {
        g.fillRect(toX(splash.x) + dir * spread - 1, toY(splash.y) - 3 - Math.round(Math.sin(splash.age * 3) * 13), 2, 2);
        g.fillRect(toX(splash.x) + (dir * spread) / 2, toY(splash.y) - 2 - Math.round(Math.sin(splash.age * 3) * 19), 2, 2);
      }
      g.fillRect(toX(splash.x) - spread - 4, toY(splash.y), spread * 2 + 8, 1);
    }
    for (const shell of this.shells) {
      const rise = Math.round(shell.age * 22);
      paint(g, toX(shell.x) + 6, toY(shell.y) - 18 - rise, 3, 2, SHELL_COLORS[Math.floor(shell.x) & 1]);
    }
    if (this.banana > 0) {
      const bananaX = toX(100);
      const bananaY = toY(53);
      paint(g, bananaX, bananaY, 8, 2, '#231a2b');
      paint(g, bananaX + 1, bananaY, 6, 1, '#f2c94c');
    }
    if (this.parcel) {
      const x = toX(this.parcel.x);
      const y = toY(this.parcel.y);
      paint(g, x - 6, y - 9, 12, 10, '#231a2b');
      paint(g, x - 5, y - 8, 10, 8, '#c9934d');
      paint(g, x - 1, y - 8, 2, 8, '#ea7a3a');
    }
    for (const visitor of this.visitors) {
      if (visitor.type === 'golfinhos') this.drawDolphins(g, visitor, toX, toY);
      if (visitor.type === 'tartaruga') this.drawTurtle(g, toX(visitor.x), toY(visitor.y));
    }
    if (this.perch) {
      const landed = this.perch.landed && !this.perch.leaving;
      paintGull(g, toX(this.perch.x), toY(this.perch.y), this.time, !landed);
    }
    for (const piece of this.confetti) {
      paint(g, toX(piece.x), toY(piece.y), 2, 2, piece.color);
    }
  }

  drawConflict(g, toX, toY) {
    const { conflict } = this;
    const tug = Math.round(Math.sin(conflict.time * 6) * 2);
    const spread = conflict.spread ?? 0;
    const x = toX(conflict.x);
    const y = toY(conflict.y);
    paintCrab(g, x - 11 + tug - spread, y, this.time);
    paintCrab(g, x + 11 + tug + spread, y, this.time);
    const half = (px) => {
      paint(g, px - 3, y - 7, 6, 6, '#231a2b');
      paint(g, px - 2, y - 6, 4, 4, '#6f4a2a');
    };
    if (conflict.resolved) {
      half(x - 5 - spread);
      half(x + 5 + spread);
      paint(g, x - 7 - spread, y - 6, 2, 4, '#f4ecd8');
      paint(g, x + 5 + spread, y - 6, 2, 4, '#f4ecd8');
    } else {
      half(x + tug - 2);
      half(x + tug + 2);
    }
  }

  drawFin(g, x, y) {
    for (let row = 0; row < 9; row += 1) {
      paint(g, x, y - row, 9 - row, 1, '#55607a');
    }
    paint(g, x + 3, y - 2, 2, 1, '#7b86a2');
    paint(g, x - 12, y + 1, 34, 1, '#d5f4f2');
    paint(g, x + 14, y + 3, 16, 1, '#d5f4f2');
  }

  drawTempFire(g, toX, toY) {
    const { x, y } = PROP_POSITIONS.fogueira;
    const left = toX(x);
    const base = toY(y - 3);
    paint(g, left - 8, base + 1, 16, 2, '#54331f');
    const beat = this.time * 10;
    for (let column = -4; column <= 4; column += 1) {
      const height = Math.round((1 - Math.abs(column) / 5) * (8 + Math.sin(beat + column * 1.7) * 2));
      paint(g, left + column, base - height, 1, height, '#ea7a3a');
      if (height > 3) paint(g, left + column, base - height + 3, 1, height - 3, '#ffe37a');
    }
  }

  drawDroplets(g, flight, color, toX, toY) {
    if (!flight) return;
    const head = this.actorHead();
    const t = flight.time / 0.5;
    for (let i = 0; i < 5; i += 1) {
      const p = Math.max(0, t - i * 0.08);
      const x = flight.fromX + (head.x - flight.fromX) * p;
      const y = flight.fromY + (head.y - flight.fromY) * p - Math.sin(p * Math.PI) * 14;
      paint(g, toX(x), toY(y), 2, 2, color);
    }
  }

  drawDolphins(g, visitor, toX, toY) {
    for (let i = 0; i < 3; i += 1) {
      const px = visitor.x + i * 32;
      const jump = Math.sin(this.time * 2.6 + i * 1.5);
      const lifted = Math.max(0, jump) * 15;
      if (jump <= -0.2) continue;
      const x = toX(px);
      const y = toY(visitor.y - lifted);
      const nose = jump > 0.5 ? -2 : 2;
      paint(g, x - 7, y - 3, 15, 6, '#231a2b');
      paint(g, x - 6, y - 2, 13, 4, '#7f93ad');
      paint(g, x - 6, y + 1, 13, 1, '#c7d3e4');
      paint(g, x - 9, y - 1 + nose / 2, 3, 2, '#7f93ad');
      paint(g, x, y - 6, 3, 3, '#5f7288');
      paint(g, x + 8, y - 3, 3, 2, '#5f7288');
      paint(g, x + 8, y + 1, 3, 2, '#5f7288');
    }
  }

  drawTurtle(g, x, y) {
    const paddle = Math.floor(this.time * 4) % 2;
    paint(g, x - 8, y - 5, 16, 6, '#231a2b');
    paint(g, x - 7, y - 4, 14, 4, '#3f8f49');
    paint(g, x - 4, y - 4, 2, 2, '#2f7741');
    paint(g, x + 2, y - 3, 2, 2, '#2f7741');
    paint(g, x - 12, y - 2, 4, 3, '#7fb06a');
    paint(g, x - 13, y - 2, 1, 1, '#231a2b');
    paint(g, x - 7, y + 1, 3, 1 + paddle, '#7fb06a');
    paint(g, x + 4, y + 1, 3, 2 - paddle, '#7fb06a');
  }
}
