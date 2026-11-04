// Uma instância de ilha. Sabe se atualizar e se desenhar em qualquer posição do mundo.

import { VARIANTS, characterSprite, decorationSprites, drawLine, hashString, islandArt } from './art.js';
import { Castaway } from './castaway.js';

// Melhorias conquistadas por estrelas. x e y são frações dos raios da ilha.
export const STAR_UPGRADES = [
  { stars: 1, sprite: 'caixote', x: 0.42, y: 0.28 },
  { stars: 3, sprite: 'barril', x: 0.6, y: 0.02 },
  { stars: 5, sprite: 'fogueira', x: -0.18, y: 0.5 },
  { stars: 10, sprite: 'bandeira', x: -0.5, y: -0.28 },
  { stars: 25, sprite: 'cabana', x: 0.1, y: -0.42 },
  { stars: 50, sprite: 'jangada', x: -1.08, y: 0.85 },
  { stars: 100, sprite: 'farol', x: -0.86, y: -0.35 },
];

const ENERGY_COLORS = { dormindo: '#9aa3b2', pescando: '#f2c94c', trabalhando: '#57d36b' };

export class Island {
  constructor(spec, x, y) {
    this.spec = spec;
    this.x = x;
    this.y = y;
    this.seed = hashString(spec.login);
    this.art = islandArt(this.seed % VARIANTS, spec.principal);
    const { rx, ry } = this.art;
    this.spots = {
      center: { x: Math.round(rx * 0.08), y: Math.round(ry * 0.2) },
      shore: { x: rx - 9, y: Math.round(ry * 0.18) },
      rock: { x: -Math.round(rx * 0.42), y: Math.round(ry * 0.38) },
      rest: { x: Math.round(rx * 0.22), y: Math.round(ry * 0.42) },
      workbench: { x: -Math.round(rx * 0.1), y: Math.round(ry * 0.5) },
      bottle: { x: rx - 16, y: Math.round(ry * 0.62) },
    };
    this.castaway = new Castaway(spec.energia, this.spots);
    this.castaway.clock = (this.seed % 100) / 10;
    this.upgrades = STAR_UPGRADES.filter((upgrade) => spec.estrelas >= upgrade.stars);
    this.time = (this.seed % 500) / 100;
    this.bottleVisible = false;
    this.drop = null;
    this.avatarImage = null;
  }

  get halfWidth() {
    return this.art.rx + 18;
  }

  isVisible(view) {
    return (
      this.x + this.halfWidth > view.left &&
      this.x - this.halfWidth < view.right &&
      this.y + 62 > view.top &&
      this.y - 92 < view.bottom
    );
  }

  contains(worldX, worldY) {
    return (
      Math.abs(worldX - this.x) < this.halfWidth && worldY > this.y - 75 && worldY < this.y + this.art.ry + 40
    );
  }

  castawayWorldPosition() {
    return { x: this.x + this.castaway.x, y: this.y + this.castaway.y };
  }

  showBottle() {
    this.bottleVisible = true;
  }

  // A caixa cai de paraquedas até o lugar da melhoria mais recente.
  dropCrate() {
    const upgrade = this.upgrades[this.upgrades.length - 1] ?? STAR_UPGRADES[0];
    this.drop = {
      targetX: Math.round(upgrade.x * this.art.rx),
      targetY: Math.round(upgrade.y * this.art.ry),
      height: 120,
      landed: 0,
    };
  }

  update(dt) {
    this.time += dt;
    this.castaway.update(dt);
    if (this.drop) {
      if (this.drop.height > 0) {
        this.drop.height = Math.max(0, this.drop.height - 34 * dt);
      } else {
        this.drop.landed += dt;
        if (this.drop.landed > 1.1) this.drop = null;
      }
    }
  }

  loadAvatar() {
    if (this.avatarImage || !this.spec.avatar) return;
    const image = new Image();
    image.decoding = 'async';
    const separator = this.spec.avatar.includes('?') ? '&' : '?';
    image.src = `${this.spec.avatar}${separator}s=48`;
    this.avatarImage = image;
  }

  draw(ctx, S, originX, originY) {
    const { art } = this;
    const blit = (image, x, y) => {
      ctx.drawImage(image, (originX + x) * S, (originY + y) * S, image.width * S, image.height * S);
    };
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect((originX + x) * S, (originY + y) * S, w * S, h * S);
    };

    blit(art.water, -art.water.width / 2, -art.water.height / 2);
    blit(art.sand, -art.sand.width / 2, -art.sand.height / 2);
    this.drawFoam(rect);

    const sway = Math.floor(this.time * 0.9) % 2;
    const sprites = decorationSprites();
    const layers = [];
    for (const palm of art.palms) {
      const frame = palm.frames[sway];
      layers.push({
        depth: palm.y,
        paint: () => blit(frame.canvas, palm.x - frame.baseX, palm.y - frame.baseY),
      });
    }
    for (const upgrade of this.upgrades) {
      const sprite = sprites[upgrade.sprite];
      const x = Math.round(upgrade.x * art.rx);
      const y = Math.round(upgrade.y * art.ry);
      layers.push({
        depth: y,
        paint: () => {
          blit(sprite, x - Math.floor(sprite.width / 2), y - sprite.height);
          if (upgrade.sprite === 'fogueira') this.drawFlame(rect, x, y);
        },
      });
    }
    layers.push({
      depth: this.castaway.y,
      paint: () => this.drawCastaway(ctx, S, originX, originY, blit, rect),
    });
    layers.sort((a, b) => a.depth - b.depth).forEach((layer) => layer.paint());

    if (this.bottleVisible) this.drawBottle(rect);
    if (this.drop) this.drawDrop(blit, rect, sprites.caixote);
    this.drawNameplate(ctx, S, originX, originY);
  }

  drawFoam(rect) {
    const { rx, ry } = this.art;
    const phase = this.time * 1.4;
    for (let i = 0; i < 26; i += 1) {
      const angle = (i / 26) * Math.PI * 2;
      const offset = 1.5 + Math.sin(phase + i * 1.7);
      const x = Math.round(Math.cos(angle) * (rx + offset));
      const y = Math.round(Math.sin(angle) * (ry + offset));
      rect(x, y, i % 3 === 0 ? 3 : 2, 1, '#ecfbf6');
    }
  }

  drawFlame(rect, x, y) {
    const tall = Math.floor(this.time * 8) % 2 === 0;
    rect(x - 2, y - 7, 5, 3, '#ea7a3a');
    rect(x - 1, y - (tall ? 10 : 9), 3, tall ? 4 : 3, '#f8d866');
  }

  drawCastaway(ctx, S, originX, originY, blit, rect) {
    const c = this.castaway;
    const sprite = characterSprite(c.pose, c.face < 0);
    const footX = Math.round(c.x);
    const footY = Math.round(c.y);
    const left = footX - Math.floor(sprite.width / 2);
    const top = footY - sprite.height;
    rect(left + 1, footY - 1, sprite.width - 2, 2, 'rgba(70, 45, 20, 0.28)');
    blit(sprite, left, top);

    const face = c.face;
    if (c.effect === 'zzz') {
      const beat = Math.floor(this.time * 1.5) % 3;
      for (let i = 0; i <= beat; i += 1) {
        const zx = footX - 6 + i * 4;
        const zy = top - 4 - i * 5;
        rect(zx, zy, 3, 1, '#f4ecd8');
        rect(zx + 1, zy + 1, 1, 1, '#f4ecd8');
        rect(zx, zy + 2, 3, 1, '#f4ecd8');
      }
    }
    if (c.effect === 'fishing') {
      const tipX = footX + face * 16;
      const tipY = top - 7;
      drawLine(ctx, S, originX + footX + face * 4, originY + top + 7, originX + tipX, originY + tipY, '#6f452a');
      const bob = Math.round(Math.sin(this.time * 3));
      drawLine(ctx, S, originX + tipX, originY + tipY, originX + tipX + face * 8, originY + footY + 10 + bob, '#f4ecd8');
      rect(tipX + face * 8, footY + 10 + bob, 2, 2, '#d84f3f');
    }
    if (c.effect === 'catch') {
      const hop = Math.round(Math.abs(Math.sin(this.time * 7)) * 3);
      const fishY = top - 6 - hop;
      const fishX = footX + face * 8;
      rect(fishX, fishY, 6, 3, '#8dd3e8');
      rect(fishX + (face > 0 ? 6 : -2), fishY + 1, 2, 1, '#5aa7c4');
      rect(fishX + (face > 0 ? 1 : 4), fishY + 1, 1, 1, '#231a2b');
    }
    if (c.effect === 'hammer') {
      const up = c.pose === 'work1';
      const handX = footX + face * (up ? 4 : 6);
      const handY = up ? top + 2 : top + 8;
      rect(handX, handY - 3, 1, 4, '#6f452a');
      rect(handX - 2, handY - 5, 5, 2, '#8c8b98');
      rect(footX + face * 7 - 5, footY - 3, 11, 3, '#a87338');
    }
    if (c.effect === 'paper') {
      rect(footX - 4, top + 7, 8, 6, '#f4ecd8');
      rect(footX - 3, top + 9, 6, 1, '#9aa3b2');
      rect(footX - 3, top + 11, 4, 1, '#9aa3b2');
    }
  }

  drawBottle(rect) {
    const bob = Math.round(Math.sin(this.time * 2.4));
    const x = this.spots.bottle.x + 7;
    const y = this.spots.bottle.y + 2 + bob;
    rect(x, y, 7, 4, '#5fbf8f');
    rect(x + 7, y + 1, 3, 2, '#3f9e72');
    rect(x + 10, y + 1, 1, 2, '#a87338');
    rect(x + 2, y + 1, 3, 2, '#f4ecd8');
  }

  drawDrop(blit, rect, crateSprite) {
    const { targetX, targetY, height, landed } = this.drop;
    const x = targetX - 6;
    const y = Math.round(targetY - 11 - height);
    if (height > 0) {
      rect(x - 8, y - 18, 28, 3, '#ea7a3a');
      rect(x - 5, y - 21, 22, 3, '#f4ecd8');
      for (const offset of [-6, 5, 16]) rect(x + offset, y - 15, 1, 15, '#f4ecd8');
    } else {
      const spread = Math.round(landed * 12);
      rect(x - spread, targetY, 2, 1, '#fbeec4');
      rect(x + 11 + spread, targetY, 2, 1, '#fbeec4');
    }
    blit(crateSprite, x, y);
  }

  drawNameplate(ctx, S, originX, originY) {
    const { spec, art } = this;
    const fontSize = Math.round(9 * S);
    ctx.font = `${fontSize}px "VT323", monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const label = spec.principal ? `★ ${spec.login}` : spec.login;
    const avatarSize = 9 * S;
    const padding = 2 * S;
    const dotSize = 3 * S;
    const width = avatarSize + padding * 3 + Math.ceil(ctx.measureText(label).width) + dotSize + padding;
    const height = avatarSize + padding * 2;
    const left = Math.round(originX * S - width / 2);
    const top = (originY + art.ry + 12) * S;

    ctx.fillStyle = spec.principal ? 'rgba(90, 55, 15, 0.92)' : 'rgba(18, 37, 56, 0.88)';
    ctx.fillRect(left, top, width, height);
    ctx.fillStyle = spec.principal ? '#f2c94c' : '#6fb7c9';
    ctx.fillRect(left, top, width, Math.max(1, Math.floor(S / 2)));

    const avatarX = left + padding;
    const avatarY = top + padding;
    ctx.fillStyle = '#3a4a5c';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    if (this.avatarImage?.complete && this.avatarImage.naturalWidth > 0) {
      ctx.drawImage(this.avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    }

    ctx.fillStyle = '#f4ecd8';
    ctx.fillText(label, avatarX + avatarSize + padding, top + height / 2 + 1);
    ctx.fillStyle = ENERGY_COLORS[spec.energia];
    ctx.fillRect(left + width - padding - dotSize, top + (height - dotSize) / 2, dotSize, dotSize);
  }
}
