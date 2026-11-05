// Objetos que o náufrago segura nas mãos.

export function drawActorItem(scene, g, joints) {
  const { actor, view, time } = scene;
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
  if (actor.item === 'wateringCan') {
    rect(hand.x - 5, hand.y - 2, 10, 7, '#231a2b');
    rect(hand.x - 4, hand.y - 1, 8, 5, '#7f93ad');
    line(hand.x + f * 5, hand.y + 1, hand.x + f * 11, hand.y - 3, '#5f7288');
  }
  if (actor.item === 'shell') {
    rect(hand.x - 3, hand.y - 4, 7, 5, '#231a2b');
    rect(hand.x - 2, hand.y - 3, 5, 3, '#ffd9c8');
  }
  if (actor.item === 'coconut') {
    scene.drawCoconut(g, hand.x + view.left, hand.y - 2 + view.top);
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
