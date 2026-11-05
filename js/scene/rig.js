// Desenha o náufrago da cena a partir do esqueleto, em pixels, com contorno escuro.

import { makeCanvas } from '../art.js';

const OUTLINE = '#231a2b';
const SKIN = '#9a6443';
const SKIN_SHADE = '#7b4b30';
const SHIRT = '#f4ecd8';
const STRIPE = '#2e5f8c';
const SHORTS = '#2f9078';
const SHORTS_SHADE = '#23705f';
const BANDANA = '#ea7a3a';

const TORSO = 13;
const UPPER_ARM = 6;
const FOREARM = 6;
const THIGH = 8;
const SHIN = 8;

const HEAD_ROWS = [
  '....bbbbb....',
  '..bbbbbbbbb..',
  '.bbbbbbbbbbb.',
  '.BBBBBBBBBBB.',
  '.hhsssssssss.',
  '.hssssssssss.',
  '.hssssssssss.',
  '.hssssssssss.',
  '.hssssssssss.',
  '..ssssssssss.',
  '...ssssssss..',
  '....dddddd...',
];
const HEAD_COLORS = { b: BANDANA, B: '#c95f2a', h: '#1f1a2e', s: SKIN, d: SKIN_SHADE };

const headBuffer = { canvas: null, g: null };
const HEAD_SIZE = 17;

function headContext() {
  if (!headBuffer.canvas) {
    [headBuffer.canvas, headBuffer.g] = makeCanvas(HEAD_SIZE, HEAD_SIZE);
  }
  return headBuffer.g;
}

function paintHead(g, facing, mood, blink, time) {
  g.clearRect(0, 0, HEAD_SIZE, HEAD_SIZE);
  const column = (x) => (facing > 0 ? x + 2 : HEAD_SIZE - 3 - x);
  const dot = (x, y, color, w = 1, h = 1) => {
    g.fillStyle = color;
    const left = facing > 0 ? column(x) : column(x) - w + 1;
    g.fillRect(left, y + 2, w, h);
  };

  const flutter = Math.round(Math.sin(time * 5));
  dot(-2, 3 + flutter, BANDANA, 2, 2);
  dot(-1, 4, '#c95f2a', 1, 2);

  HEAD_ROWS.forEach((row, y) => {
    [...row].forEach((code, x) => {
      if (code === '.') return;
      const leftEmpty = row[x - 1] === '.' || row[x - 1] === undefined;
      const rightEmpty = row[x + 1] === '.' || row[x + 1] === undefined;
      const aboveEmpty = HEAD_ROWS[y - 1]?.[x] === '.' || HEAD_ROWS[y - 1]?.[x] === undefined;
      const belowEmpty = HEAD_ROWS[y + 1]?.[x] === '.' || HEAD_ROWS[y + 1]?.[x] === undefined;
      if (leftEmpty) dot(x - 1, y, OUTLINE);
      if (rightEmpty) dot(x + 1, y, OUTLINE);
      if (aboveEmpty) dot(x, y - 1, OUTLINE);
      if (belowEmpty) dot(x, y + 1, OUTLINE);
    });
  });
  HEAD_ROWS.forEach((row, y) => {
    [...row].forEach((code, x) => {
      if (code !== '.') dot(x, y, HEAD_COLORS[code]);
    });
  });

  const eyesClosed = mood === 'asleep' || blink;
  if (eyesClosed) {
    dot(6, 6, OUTLINE, 2, 1);
    dot(9, 6, OUTLINE, 2, 1);
  } else if (mood === 'happy') {
    dot(6, 6, OUTLINE, 2, 1);
    dot(9, 6, OUTLINE, 2, 1);
    dot(6, 5, OUTLINE, 1, 1);
    dot(10, 5, OUTLINE, 1, 1);
  } else if (mood === 'surprised') {
    dot(6, 5, '#f4ecd8', 2, 2);
    dot(9, 5, '#f4ecd8', 2, 2);
    dot(7, 5, OUTLINE, 1, 2);
    dot(10, 5, OUTLINE, 1, 2);
  } else if (mood === 'sleepy') {
    dot(6, 6, OUTLINE, 2, 1);
    dot(9, 6, OUTLINE, 2, 1);
    dot(6, 5, SKIN_SHADE, 2, 1);
    dot(9, 5, SKIN_SHADE, 2, 1);
  } else {
    dot(7, 5, OUTLINE, 1, 2);
    dot(10, 5, OUTLINE, 1, 2);
  }
  if (mood === 'sad') {
    dot(6, 4, OUTLINE, 1, 1);
    dot(11, 4, OUTLINE, 1, 1);
  }
  if (mood === 'focused') {
    dot(6, 4, OUTLINE, 2, 1);
    dot(9, 4, OUTLINE, 2, 1);
  }

  if (mood === 'happy') {
    dot(7, 8, OUTLINE, 3, 1);
    dot(6, 7, OUTLINE, 1, 1);
    dot(10, 7, OUTLINE, 1, 1);
  } else if (mood === 'sad') {
    dot(7, 8, OUTLINE, 3, 1);
    dot(6, 9, OUTLINE, 1, 1);
    dot(10, 9, OUTLINE, 1, 1);
  } else if (mood === 'surprised') {
    dot(8, 8, OUTLINE, 2, 2);
  } else if (mood !== 'asleep') {
    dot(8, 8, SKIN_SHADE, 3, 1);
  }
}

function thickLine(g, x0, y0, x1, y1, width, color) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  g.fillStyle = color;
  const half = Math.floor(width / 2);
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(x0 + ((x1 - x0) * i) / steps) - half;
    const y = Math.round(y0 + ((y1 - y0) * i) / steps) - half;
    g.fillRect(x, y, width, width);
  }
}

function joint(from, angle, length, facing) {
  return { x: from.x + facing * Math.sin(angle) * length, y: from.y + Math.cos(angle) * length };
}

function drawLeg(g, hip, angle1, angle2, facing, shade) {
  const knee = joint(hip, angle1, THIGH, facing);
  const ankle = joint(knee, angle2, SHIN, facing);
  const mid = { x: (hip.x + knee.x) / 2 + (knee.x - hip.x) * 0.15, y: (hip.y + knee.y) / 2 + (knee.y - hip.y) * 0.15 };
  thickLine(g, hip.x, hip.y, knee.x, knee.y, 6, OUTLINE);
  thickLine(g, knee.x, knee.y, ankle.x, ankle.y, 5, OUTLINE);
  g.fillStyle = OUTLINE;
  const toe = facing * Math.cos(angle2);
  const footDirection = facing * (Math.abs(toe) < 0.4 ? 1 : Math.sign(toe));
  g.fillRect(Math.round(ankle.x) + (footDirection > 0 ? -2 : -5), Math.round(ankle.y) - 1, 8, 4);

  thickLine(g, knee.x, knee.y, ankle.x, ankle.y, 3, shade ? SKIN_SHADE : SKIN);
  thickLine(g, hip.x, hip.y, knee.x, knee.y, 4, shade ? SKIN_SHADE : SKIN);
  thickLine(g, hip.x, hip.y, mid.x, mid.y, 4, shade ? SHORTS_SHADE : SHORTS);
  g.fillStyle = shade ? SKIN_SHADE : SKIN;
  g.fillRect(Math.round(ankle.x) + (footDirection > 0 ? -1 : -4), Math.round(ankle.y), 6, 2);
}

function drawArm(g, shoulder, angle1, angle2, facing, shade) {
  const elbow = joint(shoulder, angle1, UPPER_ARM, facing);
  const hand = joint(elbow, angle2, FOREARM, facing);
  thickLine(g, shoulder.x, shoulder.y, elbow.x, elbow.y, 5, OUTLINE);
  thickLine(g, elbow.x, elbow.y, hand.x, hand.y, 5, OUTLINE);
  thickLine(g, elbow.x, elbow.y, hand.x, hand.y, 3, shade ? SKIN_SHADE : SKIN);
  thickLine(g, shoulder.x, shoulder.y, elbow.x, elbow.y, 3, shade ? '#d5cbb3' : SHIRT);
  return hand;
}

function drawTorso(g, hip, shoulder) {
  thickLine(g, hip.x, hip.y, shoulder.x, shoulder.y, 10, OUTLINE);
  const steps = TORSO;
  const half = 4;
  for (let i = 0; i <= steps; i += 1) {
    const x = Math.round(hip.x + ((shoulder.x - hip.x) * i) / steps) - half;
    const y = Math.round(hip.y + ((shoulder.y - hip.y) * i) / steps) - half;
    let color = i % 4 < 2 ? STRIPE : SHIRT;
    if (i < 3) color = SHORTS;
    g.fillStyle = color;
    g.fillRect(x, y, 8, 8);
  }
}

// x e y são a posição dos pés. Devolve as juntas usadas para posicionar objetos.
export function drawRig(g, x, y, facing, pose, { mood, blink, time }) {
  const hip = { x: x + facing * pose.hipX, y: y + pose.hipY };
  const shoulder = {
    x: hip.x + facing * Math.sin(pose.lean) * TORSO,
    y: hip.y - Math.cos(pose.lean) * TORSO,
  };
  const neck = {
    x: shoulder.x + facing * Math.sin(pose.lean) * 7 + facing * pose.headX,
    y: shoulder.y - Math.cos(pose.lean) * 7 + pose.headY,
  };

  const handBack = drawArm(g, shoulder, pose.armB1, pose.armB2, facing, true);
  drawLeg(g, hip, pose.legB1, pose.legB2, facing, true);
  drawLeg(g, hip, pose.legF1, pose.legF2, facing, false);
  drawTorso(g, hip, shoulder);

  paintHead(headContext(), facing, mood, blink, time);
  g.save();
  g.translate(Math.round(neck.x), Math.round(neck.y));
  g.rotate(pose.headRot * facing);
  g.drawImage(headBuffer.canvas, -Math.floor(HEAD_SIZE / 2), -Math.floor(HEAD_SIZE / 2));
  g.restore();

  const handFront = drawArm(g, shoulder, pose.armF1, pose.armF2, facing, false);
  const forearmAngle = pose.armF2;
  return { hip, shoulder, head: neck, handFront, handBack, forearmAngle };
}
