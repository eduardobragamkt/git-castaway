// Efeitos ao redor do náufrago: sono, música, tontura, suor e chapéus de datas.

export function drawActorEffect(scene, g, joints) {
  const { actor, time } = scene;
  const head = joints.head;
  scene.ambience.drawHat(g, head);
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
