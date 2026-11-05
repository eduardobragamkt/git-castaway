// Cena de tela cheia de uma ilha. Tudo é desenhado em um buffer de baixa resolução e
// ampliado uma única vez, o que garante pixels nítidos em qualquer zoom.

import { hashString, makeCanvas } from '../art.js';
import { daysOnIsland } from '../calendar.js';
import { isNight, paletteAt } from '../time.js';
import { hasUpgrade } from '../upgrades.js';
import { celebrateMilestone, collectBottle, celebrateCrate, SCENE_SPOTS } from './activities.js';
import { Actor } from './actor.js';
import { Ambience } from './ambience.js';
import { Backdrop } from './backdrop.js';
import { drawRig } from './rig.js';
import { PROP_POSITIONS, buildIsland, buildPalm, buildProps, islandFront } from './scene-art.js';
import { WorldEvents, paintCrab } from './world-events.js';

const WATERLINE_ROWS = 22;
const CASTLE_SLOTS = [
  { x: 58, y: 54 },
  { x: 74, y: 52 },
  { x: 42, y: 56 },
];

export class Scene {
  constructor(
    spec,
    {
      hourFn,
      dateFn = () => new Date(),
      distantIslets = 0,
      fixedActivity = null,
      fixedVariant = null,
      weatherOverride = null,
      tideOverride = null,
      holidayOverride = null,
    },
  ) {
    this.spec = spec;
    this.hourFn = hourFn;
    this.dateFn = dateFn;
    this.seed = hashString(spec.login || 'ilha');
    this.world = new WorldEvents(this);
    this.ambience = new Ambience(this, { dateFn, weatherOverride, tideOverride, holidayOverride });
    this.palette = null;
    this.backdrop = new Backdrop(this.seed, distantIslets);
    this.islandArt = buildIsland(this.seed, spec.principal);
    this.props = buildProps();
    this.palms = [
      {
        x: -92,
        y: 22,
        frames: [0, 0.03, 0.06].map((sway) => buildPalm(this.seed + 1, 82, sway)),
      },
    ];
    if (spec.principal || this.seed % 2 === 0) {
      this.palms.push({
        x: -48,
        y: 18,
        frames: [0.02, 0.05, 0.08].map((sway) => buildPalm(this.seed + 2, 62, sway)),
      });
    }
    this.actor = new Actor({
      energy: spec.energia,
      commits: spec.commits3d,
      stars: spec.estrelas,
      night: () => isNight(this.hourFn()),
      conditions: () => this.ambience.conditions(),
      onEvent: (event) => this.handleEvent(event),
      fixedActivity,
      fixedVariant,
    });
    this.buffer = null;
    this.foreground = null;
    this.tinted = null;
    this.view = { left: 0, top: 0, w: 0, h: 0 };
    this.time = this.seed % 100;
    this.bottleVisible = false;
    this.castles = 0;
    this.commitTiles = Math.min(spec.commits3d, 24);
    this.tileFlash = 0;
    this.falling = [];
    this.groundCoconut = null;
    this.stone = null;
    this.crab = null;
    this.gull = null;
    this.wave = null;
    this.footprints = [];
    this.drop = null;
  }

  palmCrown() {
    const palm = this.palms[0];
    const frame = palm.frames[0];
    return { x: palm.x + frame.topX - frame.baseX, y: palm.y + frame.topY - frame.baseY + 8 };
  }

  headPoint() {
    return { x: this.actor.x, y: this.actor.y - this.actor.lift - 42 };
  }

  spawnCoconut(targetX, groundY, staysOnGround) {
    const crown = this.palmCrown();
    this.falling.push({ x: crown.x, y: crown.y, vy: 0, targetX, groundY, staysOnGround });
  }

  spawnCrab() {
    const { x, y } = this.actor;
    const startX = Math.min(158, x + 90);
    const seconds = 1.8;
    this.crab = { x: startX, y: y + 4, targetX: x + 12, speed: (startX - x - 12) / seconds, fleeing: false, exitX: startX };
  }

  spawnGull() {
    const { x, y, facing } = this.actor;
    const startX = this.view.left - 24;
    this.gull = {
      x: startX,
      y: -110,
      targetX: x + facing * 7,
      targetY: y - 42,
      speedX: (x + facing * 7 - startX) / 1.3,
      speedY: (y - 42 + 110) / 1.3,
      carrying: false,
    };
  }

  handleEvent(event) {
    if (typeof event === 'function') event();
    else if (event === 'castle') this.castles = Math.min(CASTLE_SLOTS.length, this.castles + 1);
    else if (event === 'commit') this.tileFlash = 1.2;
    else if (event === 'shootingStar') this.backdrop.launchShootingStar(this.view);
    else if (event === 'coconut') this.spawnCoconut(this.actor.x + this.actor.facing * 12, this.actor.y - 2, true);
    else if (event === 'coconutHead') this.spawnCoconut(this.actor.x, this.actor.y - 46, false);
    else if (event === 'takeCoconut') this.groundCoconut = null;
    else if (event === 'stoneThrow') this.stone = { time: 0, duration: 1.3 };
    else if (event === 'crab') this.spawnCrab();
    else if (event === 'crabFlee' && this.crab) this.crab.fleeing = true;
    else if (event === 'gull') this.spawnGull();
    else if (event === 'gullFlee' && this.gull) this.gull.carrying = true;
    else if (event === 'waveWipe' && this.castles > 0) {
      this.wave = { x: CASTLE_SLOTS[this.castles - 1].x, time: 0 };
      this.castles -= 1;
    } else if (typeof event === 'string') this.world.handle(event);
  }

  celebrate(onStart, onEnd) {
    this.actor.interrupt(celebrateMilestone(onStart, onEnd));
  }

  // Marcas no poste: um risco por dia na ilha, agrupados de cinco em cinco.
  drawTally(g) {
    const days = daysOnIsland(this.spec.criadoEm, this.dateFn());
    if (!days) return;
    const x = -138 - this.view.left;
    const y = 46 - this.view.top;
    g.fillStyle = '#231a2b';
    g.fillRect(x - 6, y - 24, 13, 24);
    g.fillStyle = '#8c6340';
    g.fillRect(x - 5, y - 23, 11, 23);
    g.fillStyle = '#6f4a2a';
    g.fillRect(x + 3, y - 23, 3, 23);
    const shown = ((days - 1) % 30) + 1;
    g.fillStyle = '#f4ecd8';
    for (let mark = 0; mark < shown; mark += 1) {
      const group = Math.floor(mark / 5);
      const inGroup = mark % 5;
      const left = x - 4 + (group % 2) * 5;
      const top = y - 21 + Math.floor(group / 2) * 7;
      if (inGroup < 4) g.fillRect(left + inGroup, top, 1, 5);
      else for (let i = 0; i < 4; i += 1) g.fillRect(left + i, top + 3 - i, 1, 1);
    }
  }

  collectBottle(onPickUp, onReadStart, onReadEnd) {
    this.bottleVisible = true;
    this.actor.interrupt(
      collectBottle(
        () => {
          this.bottleVisible = false;
          onPickUp?.();
        },
        onReadStart,
        onReadEnd,
      ),
    );
  }

  dropCrate() {
    const { x, y } = PROP_POSITIONS.caixote;
    this.drop = { x, y, height: 170, landed: 0 };
    this.actor.interrupt(celebrateCrate());
  }

  // Ponto acima da cabeça, usado para ancorar o balão e o pop-up.
  anchor() {
    return { x: this.actor.x, y: this.actor.y - this.actor.lift - 48 };
  }

  hitsCastaway(worldX, worldY, tolerance) {
    const { x, lift } = this.actor;
    const y = this.actor.y - lift;
    return Math.abs(worldX - x) <= Math.max(16, tolerance) && worldY <= y + 5 && worldY >= y - 44 - Math.max(0, tolerance - 16);
  }

  update(dt) {
    this.time += dt;
    const before = Math.floor(this.actor.phase / Math.PI);
    this.actor.update(dt);
    if (this.actor.walking && Math.floor(this.actor.phase / Math.PI) !== before) {
      this.footprints.push({ x: Math.round(this.actor.x), y: Math.round(this.actor.y), age: 0 });
      if (this.footprints.length > 26) this.footprints.shift();
    }
    this.footprints.forEach((print) => {
      print.age += dt;
    });
    this.footprints = this.footprints.filter((print) => print.age < 14);
    this.tileFlash = Math.max(0, this.tileFlash - dt);

    this.falling = this.falling.filter((item) => {
      item.vy += 260 * dt;
      item.y += item.vy * dt;
      item.x += (item.targetX - item.x) * Math.min(1, dt * 5);
      if (item.y < item.groundY) return true;
      if (item.staysOnGround) this.groundCoconut = { x: item.targetX, y: item.groundY };
      return false;
    });
    this.updateCritters(dt);
    this.world.update(dt);
    this.ambience.update(dt);
    if (this.drop) {
      if (this.drop.height > 0) this.drop.height = Math.max(0, this.drop.height - 42 * dt);
      else {
        this.drop.landed += dt;
        if (this.drop.landed > 1.1) this.drop = null;
      }
    }
  }

  updateCritters(dt) {
    if (this.stone) {
      this.stone.time += dt;
      if (this.stone.time >= this.stone.duration) this.stone = null;
    }
    if (this.wave) {
      this.wave.time += dt;
      if (this.wave.time >= 1.2) this.wave = null;
    }
    if (this.crab) {
      const { crab } = this;
      if (crab.fleeing) {
        crab.x += crab.speed * 1.6 * dt;
        if (crab.x >= crab.exitX) this.crab = null;
      } else {
        crab.x = Math.max(crab.targetX, crab.x - crab.speed * dt);
      }
    }
    if (this.gull) {
      const { gull } = this;
      if (gull.carrying) {
        gull.x += 150 * dt;
        gull.y -= 70 * dt;
        if (gull.y < this.view.top - 40) this.gull = null;
      } else {
        gull.x = Math.min(gull.targetX, gull.x + gull.speedX * dt);
        gull.y = Math.min(gull.targetY, gull.y + gull.speedY * dt);
      }
    }
  }

  ensureBuffers(width, height) {
    if (this.buffer?.canvas.width === width && this.buffer.canvas.height === height) return;
    const [canvas, g] = makeCanvas(width, height);
    const [fgCanvas, fg] = makeCanvas(width, height);
    const [tintCanvas, tint] = makeCanvas(width, height);
    g.imageSmoothingEnabled = false;
    fg.imageSmoothingEnabled = false;
    tint.imageSmoothingEnabled = false;
    this.buffer = { canvas, g };
    this.foreground = { canvas: fgCanvas, g: fg };
    this.tinted = { canvas: tintCanvas, g: tint };
  }

  render(ctx, S, camera, canvasWidth, canvasHeight, clock, dt) {
    const width = Math.ceil(canvasWidth / S);
    const height = Math.ceil(canvasHeight / S);
    this.ensureBuffers(width, height);
    const left = Math.round(camera.x - width / 2);
    const top = Math.round(camera.y - height / 2);
    this.view = { left, top, w: width, h: height };

    const hour = this.hourFn();
    const palette = paletteAt(hour);
    this.palette = palette;
    const bg = this.buffer.g;
    const fg = this.foreground.g;

    this.backdrop.draw(bg, this.view, clock, hour, palette, dt);
    this.ambience.drawFireworks(bg, this.view);
    this.world.drawBack(bg);
    this.drawReflection(bg, palette);

    fg.clearRect(0, 0, width, height);
    this.ambience.drawTideBand(fg);
    fg.drawImage(this.islandArt.canvas, -this.islandArt.ox - left, -this.islandArt.oy - top);
    this.drawFootprints(fg);
    this.drawFoam(fg, palette);
    this.drawObjects(fg, palette);

    this.applyLight(bg, palette, width, height);
    this.drawLights(bg, palette);
    this.ambience.drawWeather(bg, this.view);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buffer.canvas, 0, 0, width * S, height * S);
  }

  applyLight(bg, palette, width, height) {
    if (palette.ambient === '#ffffff') {
      bg.drawImage(this.foreground.canvas, 0, 0);
      return;
    }
    const tint = this.tinted.g;
    tint.globalCompositeOperation = 'source-over';
    tint.clearRect(0, 0, width, height);
    tint.drawImage(this.foreground.canvas, 0, 0);
    tint.globalCompositeOperation = 'multiply';
    tint.fillStyle = palette.ambient;
    tint.fillRect(0, 0, width, height);
    tint.globalCompositeOperation = 'destination-in';
    tint.drawImage(this.foreground.canvas, 0, 0);
    bg.drawImage(this.tinted.canvas, 0, 0);
  }

  drawReflection(g, palette) {
    const { left, top } = this.view;
    g.fillStyle = '#0a1a33';
    for (let row = 0; row < WATERLINE_ROWS; row += 1) {
      const y = 58 + this.ambience.tideOffset + row;
      const shrink = row * row * 0.32;
      const wobble = Math.round(Math.sin(this.time * 2 + row * 0.9) * 2);
      const half = 150 - shrink;
      if (half <= 0) break;
      g.globalAlpha = (0.32 - row * 0.013) * (1 - palette.night * 0.25);
      if (row % 3 !== 2) g.fillRect(Math.round(-half + wobble - left), y - top, Math.round(half * 2), 1);
    }
    g.globalAlpha = 1;
  }

  drawFootprints(g) {
    const { left, top } = this.view;
    g.fillStyle = '#b89a5e';
    for (const print of this.footprints) {
      g.globalAlpha = Math.max(0, 0.7 - print.age / 20);
      g.fillRect(print.x - left, print.y - top, 2, 1);
    }
    g.globalAlpha = 1;
  }

  drawFoam(g, palette) {
    const { left, top } = this.view;
    const wash = Math.sin(this.time * 0.9) * 1.6;
    for (let x = -158; x <= 158; x += 3) {
      const y = islandFront(Math.max(-152, Math.min(152, x))) + this.ambience.tideOffset;
      const ripple = Math.round(Math.sin(this.time * 1.8 + x * 0.14) * 1.2 + wash);
      if ((x + Math.floor(this.time * 3)) % 15 === 0) continue;
      g.fillStyle = palette.night > 0.6 ? palette.cap : '#f2fbf6';
      g.fillRect(x - left, Math.round(y + ripple) - top, 3, 1);
      if (x % 9 === 0) {
        g.globalAlpha = 0.6;
        g.fillRect(x - left + 1, Math.round(y + ripple + 2) - top, 4, 1);
        g.globalAlpha = 1;
      }
    }
  }

  drawProp(g, name) {
    const sprite = this.props[name];
    const { x, y } = PROP_POSITIONS[name];
    g.drawImage(sprite, Math.round(x - sprite.width / 2 - this.view.left), Math.round(y - sprite.height - this.view.top));
  }

  drawObjects(g, palette) {
    const { spec, actor, view } = this;
    const layers = [];
    const swayFrame = Math.floor(this.time * 1.1) % 4;
    const swayIndex = swayFrame === 3 ? 1 : swayFrame;

    for (const palm of this.palms) {
      const frame = palm.frames[swayIndex];
      layers.push({
        depth: palm.y,
        paint: () => {
          g.fillStyle = 'rgba(70, 45, 20, 0.2)';
          g.fillRect(palm.x - 14 - view.left, palm.y - view.top, 28, 2);
          g.drawImage(frame.canvas, palm.x - frame.baseX - view.left, palm.y - frame.baseY - view.top);
        },
      });
    }

    const stars = spec.estrelas;
    const owned = ['caixote', 'barril', 'fogueira', 'bandeira', 'cabana', 'farol'].filter((name) => hasUpgrade(stars, name));
    for (const name of owned) {
      layers.push({
        depth: PROP_POSITIONS[name].y,
        paint: () => {
          this.drawProp(g, name);
          if (name === 'bandeira') this.drawFlagCloth(g);
          if (name === 'fogueira') this.drawFlames(g);
        },
      });
    }
    layers.push({
      depth: PROP_POSITIONS.bancada.y,
      paint: () => (this.world.benchDown > 0 ? this.drawFallenBench(g) : this.drawProp(g, 'bancada')),
    });
    layers.push({ depth: 46, paint: () => this.drawTally(g) });
    if (spec.commits3d > 0 || actor.commits > 0) {
      layers.push({
        depth: PROP_POSITIONS.quadro.y,
        paint: () => {
          this.drawProp(g, 'quadro');
          this.drawCommitTiles(g);
          if (this.world.boardPainted) this.drawBoardPaint(g);
        },
      });
    }
    for (let i = 0; i < this.castles; i += 1) {
      layers.push({ depth: CASTLE_SLOTS[i].y, paint: () => this.drawCastle(g, CASTLE_SLOTS[i]) });
    }
    layers.push({ depth: actor.y, paint: () => this.drawActor(g, palette) });
    layers.sort((a, b) => a.depth - b.depth).forEach((layer) => layer.paint());

    for (const item of this.falling) {
      this.drawCoconut(g, item.x, item.y);
    }
    if (this.groundCoconut) this.drawCoconut(g, this.groundCoconut.x, this.groundCoconut.y);
    if (this.stone) this.drawStone(g);
    if (this.crab) this.drawCrab(g);
    if (this.wave) this.drawWave(g);
    if (this.gull) this.drawGull(g);
    if (this.bottleVisible) this.drawBottle(g);
    if (this.drop) this.drawDrop(g);
    this.world.drawFront(g);
    this.ambience.drawDecorations(g);
  }

  drawFallenBench(g) {
    const { x, y } = PROP_POSITIONS.bancada;
    const left = Math.round(x - 16 - this.view.left);
    const bottom = Math.round(y - this.view.top);
    g.fillStyle = '#3d2a1d';
    g.fillRect(left - 2, bottom - 5, 36, 5);
    g.fillStyle = '#b98347';
    g.fillRect(left - 1, bottom - 4, 34, 3);
    g.fillStyle = '#54331f';
    g.fillRect(left + 2, bottom - 8, 10, 3);
    g.fillRect(left + 20, bottom - 7, 9, 2);
  }

  drawBoardPaint(g) {
    const { x, y } = PROP_POSITIONS.quadro;
    const sprite = this.props.quadro;
    const left = Math.round(x - sprite.width / 2 - this.view.left) + 1;
    const top = Math.round(y - sprite.height - this.view.top) + 1;
    g.fillStyle = '#ea7a3a';
    g.fillRect(left, top, 36, 2);
    g.fillRect(left, top + 17, 36, 2);
  }

  drawActor(g, palette) {
    const { actor, view, time } = this;
    const x = Math.round(actor.x) - view.left;
    const groundY = Math.round(actor.y) - view.top;
    const y = groundY - Math.round(actor.lift);
    const inSea = Math.abs(actor.x) > 154;
    if (!inSea) {
      g.fillStyle = 'rgba(70, 45, 20, 0.3)';
      g.fillRect(x - 10, groundY - 1, 20, 2);
      g.fillRect(x - 8, groundY + 1, 16, 1);
    }
    const blink = time % 3.7 < 0.13;
    // No mar, as pernas são cortadas na linha d'água, e a água real aparece por baixo.
    g.save();
    if (inSea) {
      g.beginPath();
      g.rect(0, 0, view.w, groundY - 7);
      g.clip();
    }
    const joints = drawRig(g, x, y, actor.facing, actor.pose, { mood: actor.mood, blink, time });
    g.restore();
    this.drawItem(g, joints);
    this.drawEffect(g, joints);
    if (inSea) this.drawRipples(g, x, groundY, palette);
  }

  drawRipples(g, x, y, palette) {
    const ripple = Math.round(Math.sin(this.time * 3) * 2);
    g.fillStyle = palette.cap;
    g.fillRect(x - 11 - ripple, y - 7, 22 + ripple * 2, 1);
    g.fillRect(x - 15 + ripple, y - 4, 30, 1);
  }

  drawStone(g) {
    const { time, duration } = this.stone;
    const t = time / duration;
    const crown = this.palmCrown();
    const head = this.headPoint();
    const startX = this.actor.x + this.actor.facing * 8;
    const startY = this.actor.y - 34;
    let x;
    let y;
    if (t < 0.5) {
      const up = t / 0.5;
      x = startX + (crown.x - startX) * up;
      y = startY + (crown.y - startY) * (1 - (1 - up) ** 2);
    } else {
      const down = (t - 0.5) / 0.5;
      x = crown.x + (head.x - crown.x) * down;
      y = crown.y + (head.y - crown.y) * down ** 2;
    }
    const left = Math.round(x - this.view.left);
    const top = Math.round(y - this.view.top);
    g.fillStyle = '#231a2b';
    g.fillRect(left - 2, top - 2, 5, 5);
    g.fillStyle = '#918f9c';
    g.fillRect(left - 1, top - 1, 3, 3);
  }

  drawCrab(g) {
    const { crab, time } = this;
    paintCrab(g, Math.round(crab.x) - this.view.left, Math.round(crab.y) - this.view.top, time);
  }

  drawGull(g) {
    const { gull, time } = this;
    const x = Math.round(gull.x) - this.view.left;
    const y = Math.round(gull.y) - this.view.top;
    const up = Math.sin(time * 16) > 0;
    const rect = (px, py, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x + px, y + py, w, h);
    };
    rect(-7, -2, 14, 6, '#231a2b');
    rect(-6, -1, 12, 4, '#f4f6ff');
    rect(6, 0, 3, 2, '#ea9a3a');
    rect(4, -1, 1, 1, '#231a2b');
    if (up) {
      rect(-5, -7, 9, 5, '#231a2b');
      rect(-4, -6, 7, 4, '#c7d3e4');
    } else {
      rect(-5, 2, 9, 5, '#231a2b');
      rect(-4, 3, 7, 3, '#c7d3e4');
    }
    if (gull.carrying) {
      rect(-5, 5, 10, 5, '#231a2b');
      rect(-4, 6, 8, 3, '#7fd0e8');
    }
  }

  drawWave(g) {
    const { x, time } = this.wave;
    const t = time / 1.2;
    const reach = Math.sin(t * Math.PI);
    const left = x - this.view.left;
    const bottom = 60 - this.view.top;
    const height = Math.round(reach * 13);
    for (let dx = -22; dx <= 22; dx += 1) {
      const fade = 1 - Math.abs(dx) / 24;
      const columnHeight = Math.round(height * fade);
      if (columnHeight <= 0) continue;
      g.fillStyle = '#7fcfdc';
      g.fillRect(left + dx, bottom - columnHeight, 1, columnHeight);
      g.fillStyle = '#f2fbf6';
      g.fillRect(left + dx, bottom - columnHeight, 1, 1 + ((dx & 3) === 0 ? 1 : 0));
    }
  }

  drawItem(g, joints) {
    const { actor, view, time } = this;
    const hand = { x: Math.round(joints.handFront.x), y: Math.round(joints.handFront.y) };
    const f = actor.facing;
    const rect = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const line = (x0, y0, x1, y1, color) => {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      g.fillStyle = color;
      for (let i = 0; i <= steps; i += 1) {
        g.fillRect(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), 1, 1);
      }
    };
    if (actor.item === 'rod') {
      const tipX = hand.x + f * 26;
      const tipY = hand.y - 24;
      line(hand.x - f * 3, hand.y + 3, tipX, tipY, '#54331f');
      const bob = Math.round(Math.sin(time * 2.6) * 1.2);
      const floatX = tipX + f * 14;
      const floatY = 66 - view.top + bob;
      line(tipX, tipY, floatX, floatY, '#f4ecd8');
      rect(floatX - 1, floatY, 3, 2, '#d84f3f');
      rect(floatX - 4, floatY + 3, 9, 1, '#d5f4f2');
    }
    if (actor.item === 'fish') {
      const y = hand.y - 8 + Math.round(Math.sin(time * 9));
      rect(hand.x - 1, y - 2, 2, 8, '#d5cbb3');
      rect(hand.x - 6, y + 4, 12, 6, '#231a2b');
      rect(hand.x - 5, y + 5, 10, 4, '#7fd0e8');
      rect(hand.x - 5, y + 7, 10, 2, '#4f9fc0');
      rect(hand.x + f * 6 - 1, y + 5, 3, 4, '#2f7fa8');
      rect(hand.x - f * 3, y + 5, 2, 2, '#231a2b');
    }
    if (actor.item === 'hammer') {
      const dx = f * Math.sin(joints.forearmAngle + 1.57);
      const dy = Math.cos(joints.forearmAngle + 1.57);
      const endX = hand.x + dx * 10;
      const endY = hand.y + dy * 10;
      line(hand.x, hand.y, endX, endY, '#54331f');
      rect(endX - 4, endY - 2, 9, 4, '#231a2b');
      rect(endX - 3, endY - 1, 7, 2, '#a09eaa');
    }
    if (actor.item === 'stick') {
      line(hand.x, hand.y, hand.x + f * 7, hand.y - 7, '#54331f');
    }
    if (actor.item === 'boot') {
      const y = hand.y - 3 + Math.round(Math.sin(time * 7));
      line(hand.x, hand.y - 8, hand.x, y, '#f4ecd8');
      rect(hand.x - 5, y, 8, 9, '#231a2b');
      rect(hand.x - 5, y + 6, 13, 5, '#231a2b');
      rect(hand.x - 4, y + 1, 6, 8, '#6f4a2a');
      rect(hand.x - 4, y + 7, 11, 3, '#54331f');
    }
    if (actor.item === 'hook') {
      line(hand.x, hand.y - 8, hand.x, hand.y + 5, '#f4ecd8');
      rect(hand.x, hand.y + 5, 3, 1, '#a09eaa');
      rect(hand.x + 3, hand.y + 3, 1, 3, '#a09eaa');
    }
    if (actor.item === 'stone') {
      rect(hand.x - 2, hand.y - 2, 5, 5, '#231a2b');
      rect(hand.x - 1, hand.y - 1, 3, 3, '#918f9c');
    }
    if (actor.item === 'cooking') {
      const tipX = hand.x + f * 18;
      const tipY = hand.y - 3;
      line(hand.x, hand.y, tipX, tipY, '#54331f');
      rect(tipX - 5, tipY - 3, 10, 5, '#231a2b');
      rect(tipX - 4, tipY - 2, 8, 3, '#d98a4a');
      if (Math.floor(time * 2) % 2 === 0) rect(tipX, tipY - 8, 1, 3, 'rgba(244, 236, 216, 0.7)');
    }
    if (actor.item === 'cooked') {
      rect(hand.x - 5, hand.y - 4, 10, 5, '#231a2b');
      rect(hand.x - 4, hand.y - 3, 8, 3, '#b8682e');
    }
    if (actor.item === 'book') {
      const x = (hand.x + joints.handBack.x) / 2;
      const y = (hand.y + joints.handBack.y) / 2;
      rect(x - 7, y - 7, 14, 9, '#231a2b');
      rect(x - 6, y - 6, 6, 7, '#2e5f8c');
      rect(x, y - 6, 6, 7, '#3a74a8');
      rect(x - 1, y - 6, 1, 7, '#f4ecd8');
    }
    if (actor.item === 'bookFace') {
      rect(joints.head.x - 7, joints.head.y - 5, 14, 5, '#231a2b');
      rect(joints.head.x - 6, joints.head.y - 4, 12, 3, '#2e5f8c');
    }
    if (actor.item === 'sticks') {
      line(hand.x, hand.y, hand.x + f * 7, hand.y + 5, '#6f452a');
      line(joints.handBack.x, joints.handBack.y, joints.handBack.x + f * 7, joints.handBack.y - 3, '#54331f');
    }
    if (actor.item === 'saw') {
      rect(hand.x + (f > 0 ? 0 : -14), hand.y - 1, 14, 3, '#231a2b');
      rect(hand.x + (f > 0 ? 1 : -13), hand.y, 12, 1, '#a09eaa');
      rect(hand.x + (f > 0 ? -3 : 0), hand.y - 2, 3, 5, '#6f452a');
    }
    if (actor.item === 'plank') {
      rect(hand.x - 13, hand.y - 3, 26, 4, '#231a2b');
      rect(hand.x - 12, hand.y - 2, 24, 2, '#b98347');
    }
    if (actor.item === 'ruler') {
      rect(hand.x + (f > 0 ? 0 : -14), hand.y - 1, 14, 2, '#f2c94c');
      for (let mark = 0; mark < 14; mark += 3) rect(hand.x + (f > 0 ? mark : -mark), hand.y - 1, 1, 1, '#231a2b');
    }
    if (actor.item === 'brush') {
      line(hand.x, hand.y, hand.x + f * 6, hand.y - 6, '#6f452a');
      rect(hand.x + f * 6 - 1, hand.y - 9, 3, 3, '#ea7a3a');
    }
    if (actor.item === 'spyglass' || actor.item === 'spyglassBackwards') {
      const eyeX = joints.head.x + f * 6;
      const eyeY = joints.head.y + 1;
      line(eyeX, eyeY, hand.x, hand.y, '#54331f');
      const wide = actor.item === 'spyglass';
      rect(eyeX + (f > 0 ? 0 : -14), eyeY - (wide ? 1 : 2), 14, wide ? 3 : 5, '#231a2b');
      rect(eyeX + (f > 0 ? 1 : -13), eyeY - (wide ? 0 : 1), 12, wide ? 1 : 3, '#c9934d');
    }
    if (actor.item === 'shell') {
      rect(hand.x - 3, hand.y - 4, 7, 5, '#231a2b');
      rect(hand.x - 2, hand.y - 3, 5, 3, '#ffd9c8');
    }
    if (actor.item === 'coconut') {
      this.drawCoconut(g, hand.x + view.left, hand.y - 2 + view.top);
    }
    if (actor.item === 'paper') {
      const x = (hand.x + joints.handBack.x) / 2;
      const y = (hand.y + joints.handBack.y) / 2;
      rect(x - 7, y - 9, 14, 11, '#231a2b');
      rect(x - 6, y - 8, 12, 9, '#f4ecd8');
      rect(x - 4, y - 6, 8, 1, '#9aa3b2');
      rect(x - 4, y - 4, 8, 1, '#9aa3b2');
      rect(x - 4, y - 2, 5, 1, '#9aa3b2');
    }
  }

  drawEffect(g, joints) {
    const { actor, time } = this;
    const head = joints.head;
    this.ambience.drawHat(g, head);
    if (actor.effect === 'ink') {
      g.fillStyle = '#231a2b';
      g.fillRect(Math.round(head.x) - 5, Math.round(head.y) - 3, 10, 4);
      g.fillRect(Math.round(head.x) - 3, Math.round(head.y) + 1, 6, 3);
    }
    if (actor.effect === 'dust') {
      g.fillStyle = '#e7d9b6';
      for (let i = 0; i < 4; i += 1) {
        const drift = (time * 1.7 + i * 0.25) % 1;
        g.fillRect(
          Math.round(joints.handFront.x + actor.facing * (4 + drift * 14)),
          Math.round(joints.handFront.y + drift * 12 - 4 + i),
          2,
          1,
        );
      }
    }
    if (actor.effect === 'zzz') {
      for (let i = 0; i < 3; i += 1) {
        const rise = (time * 0.7 + i * 0.33) % 1;
        const size = 2 + i;
        const x = Math.round(head.x + 6 + rise * 12 + Math.sin(time + i) * 2);
        const y = Math.round(head.y - 8 - rise * 26);
        g.globalAlpha = 1 - rise;
        g.fillStyle = '#f4ecd8';
        g.fillRect(x, y, size + 1, 1);
        g.fillRect(x + Math.floor(size / 2), y + 1, 1, Math.max(1, size - 1));
        g.fillRect(x, y + size, size + 1, 1);
      }
      g.globalAlpha = 1;
    }
    if (actor.effect === 'notes') {
      for (let i = 0; i < 2; i += 1) {
        const rise = (time * 0.8 + i * 0.5) % 1;
        const x = Math.round(head.x + (i ? -13 : 11) + Math.sin(time * 3 + i) * 3);
        const y = Math.round(head.y - 8 - rise * 18);
        g.globalAlpha = 1 - rise;
        g.fillStyle = '#ffe37a';
        g.fillRect(x, y, 1, 5);
        g.fillRect(x + 1, y, 2, 1);
        g.fillRect(x - 2, y + 4, 3, 2);
      }
      g.globalAlpha = 1;
    }
    if (actor.effect === 'stars') {
      for (let i = 0; i < 3; i += 1) {
        const angle = time * 5 + (i * Math.PI * 2) / 3;
        const x = Math.round(head.x + Math.cos(angle) * 10);
        const y = Math.round(head.y - 11 + Math.sin(angle) * 3);
        g.fillStyle = '#ffe37a';
        g.fillRect(x - 1, y, 3, 1);
        g.fillRect(x, y - 1, 1, 3);
      }
    }
    if (actor.effect === 'sweat') {
      const drop = (time * 1.6) % 1;
      const side = actor.facing * -8;
      g.globalAlpha = 1 - drop;
      g.fillStyle = '#8dd3e8';
      g.fillRect(Math.round(head.x + side), Math.round(head.y - 5 + drop * 12), 2, 3);
      g.globalAlpha = 1;
    }
    if (actor.effect === 'angry') {
      const puff = Math.floor(time * 4) % 2;
      g.fillStyle = '#d84f3f';
      g.fillRect(Math.round(head.x) + 6, Math.round(head.y) - 12 - puff, 5, 1);
      g.fillRect(Math.round(head.x) + 8, Math.round(head.y) - 14 - puff, 1, 5);
    }
    if (actor.effect === 'splash') {
      g.fillStyle = '#d5f4f2';
      for (let i = 0; i < 5; i += 1) {
        const rise = (time * 1.5 + i * 0.21) % 1;
        const x = Math.round(head.x + (i - 2) * 8);
        const y = Math.round(head.y + 28 - Math.sin(rise * Math.PI) * 14);
        g.fillRect(x, y, 2, 2);
      }
    }
    if (actor.mood === 'surprised') {
      g.fillStyle = '#ffffff';
      g.fillRect(Math.round(head.x) - 1, Math.round(head.y) - 16, 2, 5);
      g.fillRect(Math.round(head.x) - 1, Math.round(head.y) - 10, 2, 2);
    }
  }

  drawCoconut(g, worldX, worldY) {
    const x = Math.round(worldX - this.view.left);
    const y = Math.round(worldY - this.view.top);
    g.fillStyle = '#231a2b';
    g.fillRect(x - 3, y - 2, 6, 5);
    g.fillRect(x - 2, y - 3, 4, 7);
    g.fillStyle = '#6f4a2a';
    g.fillRect(x - 2, y - 2, 4, 5);
    g.fillStyle = '#8c6340';
    g.fillRect(x - 2, y - 2, 2, 1);
  }

  drawFlagCloth(g) {
    const { x, y } = PROP_POSITIONS.bandeira;
    const sprite = this.props.bandeira;
    const originX = Math.round(x - sprite.width / 2 - this.view.left) + 5;
    const originY = Math.round(y - sprite.height - this.view.top) + 2;
    for (let column = 0; column < 28; column += 1) {
      const wave = Math.round(Math.sin(this.time * 4 - column * 0.34) * (column / 16));
      g.fillStyle = '#231a2b';
      g.fillRect(originX + column, originY + wave - 1, 1, 20);
      g.fillStyle = column > 20 ? '#c95f2a' : '#ea7a3a';
      g.fillRect(originX + column, originY + wave, 1, 18);
      const mark = (top, height) => {
        g.fillStyle = '#f4ecd8';
        g.fillRect(originX + column, originY + wave + top, 1, height);
      };
      if (column >= 7 && column <= 9) mark(3, 12);
      if (column >= 5 && column <= 11) {
        mark(2, 3);
        mark(13, 3);
      }
      if (column >= 15 && column <= 20) mark(4, 3);
      if (column >= 9 && column <= 17) mark(8, 1);
    }
  }

  drawFlames(g) {
    const { x, y } = PROP_POSITIONS.fogueira;
    const left = x - this.view.left;
    const base = y - this.view.top - 6;
    const beat = this.time * 10;
    for (let column = -6; column <= 6; column += 1) {
      const height = Math.round((1 - Math.abs(column) / 7) * (12 + Math.sin(beat + column * 1.7) * 3));
      g.fillStyle = '#d84f3f';
      g.fillRect(left + column, base - height, 1, height);
      if (height > 3) {
        g.fillStyle = '#ea9a3a';
        g.fillRect(left + column, base - height + 3, 1, height - 3);
      }
      if (height > 7 && Math.abs(column) < 4) {
        g.fillStyle = '#ffe37a';
        g.fillRect(left + column, base - height + 7, 1, height - 7);
      }
    }
  }

  drawCommitTiles(g) {
    const { x, y } = PROP_POSITIONS.quadro;
    const sprite = this.props.quadro;
    const left = Math.round(x - sprite.width / 2 - this.view.left) + 3;
    const top = Math.round(y - sprite.height - this.view.top) + 4;
    const shades = ['#0e4429', '#006d32', '#26a641', '#39d353'];
    for (let i = 0; i < 24; i += 1) {
      const column = i % 8;
      const row = Math.floor(i / 8);
      const filled = i < this.commitTiles;
      let color = '#54331f';
      if (filled) color = shades[(i * 7 + this.seed) % shades.length];
      if (filled && i === this.commitTiles - 1 && this.tileFlash > 0) color = '#ffffff';
      g.fillStyle = color;
      g.fillRect(left + column * 4, top + row * 5, 3, 4);
    }
  }

  drawCastle(g, slot) {
    const x = slot.x - this.view.left;
    const y = slot.y - this.view.top;
    const rect = (px, py, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x + px, y + py, w, h);
    };
    rect(-9, -5, 18, 5, '#d6b370');
    rect(-8, -11, 5, 7, '#ecd08c');
    rect(3, -11, 5, 7, '#ecd08c');
    rect(-2, -9, 4, 5, '#e2c27c');
    rect(-1, -3, 2, 3, '#a58a58');
    rect(-8, -12, 1, 1, '#ecd08c');
    rect(-4, -12, 1, 1, '#ecd08c');
    rect(3, -12, 1, 1, '#ecd08c');
    rect(7, -12, 1, 1, '#ecd08c');
    rect(0, -14, 1, 5, '#54331f');
    rect(1, -14, 3, 2, '#ea7a3a');
  }

  drawBottle(g) {
    const bob = Math.round(Math.sin(this.time * 2.4));
    const x = SCENE_SPOTS.bottle.x + 12 - this.view.left;
    const y = SCENE_SPOTS.bottle.y + 6 + bob - this.view.top;
    g.fillStyle = '#231a2b';
    g.fillRect(x - 1, y - 1, 14, 7);
    g.fillRect(x + 12, y, 7, 5);
    g.fillStyle = '#5fbf8f';
    g.fillRect(x, y, 12, 5);
    g.fillStyle = '#3f9e72';
    g.fillRect(x + 12, y + 1, 5, 3);
    g.fillStyle = '#a87338';
    g.fillRect(x + 17, y + 1, 1, 3);
    g.fillStyle = '#f4ecd8';
    g.fillRect(x + 3, y + 1, 6, 3);
    g.fillStyle = '#b7f0d4';
    g.fillRect(x + 1, y, 9, 1);
  }

  drawDrop(g) {
    const { x, y, height, landed } = this.drop;
    const sprite = this.props.caixote;
    const left = Math.round(x - sprite.width / 2 - this.view.left);
    const top = Math.round(y - sprite.height - height - this.view.top);
    if (height > 0) {
      const sway = Math.round(Math.sin(this.time * 2.4) * 3);
      for (let row = 0; row < 15; row += 1) {
        const half = Math.round(24 * Math.sqrt(1 - ((14 - row) / 15) ** 2));
        g.fillStyle = Math.floor((left + row) / 5) % 2 === 0 ? '#ea7a3a' : '#f4ecd8';
        g.fillRect(left + 12 - half + sway, top - 36 + row, half * 2, 1);
      }
      g.fillStyle = '#f4ecd8';
      for (const offset of [-18, 0, 18]) {
        const steps = 21;
        for (let i = 0; i < steps; i += 1) {
          const lx = left + 12 + sway + offset - (offset * i) / steps;
          g.fillRect(Math.round(lx), top - 21 + i, 1, 1);
        }
      }
    } else {
      const spread = Math.round(landed * 22);
      g.fillStyle = '#fff3cf';
      for (const dir of [-1, 1]) {
        g.fillRect(left + 12 + dir * (14 + spread), y - this.view.top - 1 - Math.round(landed * 6), 2, 2);
        g.fillRect(left + 12 + dir * (8 + spread), y - this.view.top - Math.round(landed * 3), 2, 1);
      }
    }
    g.drawImage(sprite, left, top);
  }

  // Luzes noturnas são desenhadas depois da escuridão, para continuarem acesas.
  drawLights(g, palette) {
    if (palette.night < 0.3) return;
    const { left, top } = this.view;
    const strength = Math.min(1, (palette.night - 0.3) / 0.5);
    // Brilho em anéis pontilhados: a borda se dissolve em vez de formar um disco.
    const glow = (x, y, radius, alpha) => {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255, 130, 50, ${alpha * strength})`;
      for (let dy = -radius; dy <= radius; dy += 1) {
        const half = Math.round(Math.sqrt(radius * radius - dy * dy));
        for (let dx = -half; dx < half; dx += 1) {
          const edge = (dx * dx + dy * dy) / (radius * radius);
          if (edge > 0.55 && (dx + dy) % 2 !== 0) continue;
          g.fillRect(x + dx - left, y + dy - top, 1, 1);
        }
      }
      g.restore();
    };
    const { spec } = this;
    if (hasUpgrade(spec.estrelas, 'fogueira')) {
      const { x, y } = PROP_POSITIONS.fogueira;
      const flicker = Math.round(Math.sin(this.time * 9) * 1.5);
      glow(x, y - 8, 40 + flicker, 0.07);
      glow(x, y - 8, 24 + flicker, 0.09);
      this.drawFlames(g);
    }
    if (hasUpgrade(spec.estrelas, 'cabana')) {
      const { x, y } = PROP_POSITIONS.cabana;
      g.globalAlpha = strength;
      g.fillStyle = '#ffd86b';
      g.fillRect(x - 36 + 15 - left, y - 58 + 34 - top, 9, 9);
      g.fillRect(x - 36 + 48 - left, y - 58 + 34 - top, 9, 9);
      g.globalAlpha = 1;
    }
    if (hasUpgrade(spec.estrelas, 'farol')) {
      const { x, y } = PROP_POSITIONS.farol;
      const lampX = x - left;
      const lampY = y - 92 + 13 - top;
      g.globalAlpha = strength;
      g.fillStyle = '#fff2a8';
      g.fillRect(lampX - 5, lampY - 4, 10, 9);
      g.globalAlpha = 1;
      // O facho gira: fica mais forte nas laterais e some ao apontar para a frente.
      const sweep = Math.sin(this.time * 0.8);
      const reach = Math.sign(sweep) * 260;
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255, 240, 170, ${0.16 * strength * Math.abs(sweep)})`;
      g.beginPath();
      g.moveTo(lampX, lampY);
      g.lineTo(lampX + reach, lampY - 20);
      g.lineTo(lampX + reach, lampY + 14);
      g.closePath();
      g.fill();
      g.restore();
    }
  }
}
