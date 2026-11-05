// Ciclo de 24 horas: define as cores do céu, do mar e da luz em cada hora do dia.

const NIGHT = {
  sky: ['#060a24', '#0a1236', '#101b4a', '#18275e', '#24386f'],
  sea: ['#0d1c42', '#123058'],
  cap: '#5f86b8',
  ambient: '#4f5f9c',
  cloud: '#3a4a75',
  cloudShade: '#252f57',
  sun: '#f4f0d0',
  night: 1,
};
const DAWN = {
  sky: ['#3b4f8c', '#7a6aa8', '#d98a9c', '#f7b58a', '#ffdf9e'],
  sea: ['#58648f', '#5f8aa0'],
  cap: '#ffd9b8',
  ambient: '#ffdcc8',
  cloud: '#ffd4bd',
  cloudShade: '#c4899c',
  sun: '#ffd27a',
  night: 0.25,
};
const DAY = {
  sky: ['#2b7fd0', '#4a9be0', '#74b8ea', '#a4d4f0', '#d2ebf2'],
  sea: ['#1d6fa0', '#2a9db5'],
  cap: '#d5f4f2',
  ambient: '#ffffff',
  cloud: '#ffffff',
  cloudShade: '#c7d8ea',
  sun: '#fff3b0',
  night: 0,
};
const DUSK = {
  sky: ['#2a2a66', '#6a3b85', '#c64f76', '#f2825a', '#ffc46b'],
  sea: ['#3f3b74', '#a85a6a'],
  cap: '#ffb98a',
  ambient: '#f2b599',
  cloud: '#f7a78c',
  cloudShade: '#8f4f86',
  sun: '#ff9d57',
  night: 0.4,
};

const KEYFRAMES = [
  [0, NIGHT],
  [5, NIGHT],
  [6.25, DAWN],
  [8, DAY],
  [17, DAY],
  [18.5, DUSK],
  [20, NIGHT],
  [24, NIGHT],
];

function toRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function mixColor(a, b, amount) {
  const from = toRgb(a);
  const to = toRgb(b);
  const channel = (i) => Math.round(from[i] + (to[i] - from[i]) * amount);
  return `#${[0, 1, 2].map((i) => channel(i).toString(16).padStart(2, '0')).join('')}`;
}

export function normalizeHour(hour) {
  return ((hour % 24) + 24) % 24;
}

export function paletteAt(rawHour) {
  const hour = normalizeHour(rawHour);
  let index = KEYFRAMES.findIndex(([limit], i) => hour >= limit && hour < KEYFRAMES[i + 1]?.[0]);
  if (index < 0) index = KEYFRAMES.length - 2;
  const [startHour, from] = KEYFRAMES[index];
  const [endHour, to] = KEYFRAMES[index + 1];
  const t = (hour - startHour) / (endHour - startHour);
  return {
    sky: from.sky.map((color, i) => mixColor(color, to.sky[i], t)),
    sea: from.sea.map((color, i) => mixColor(color, to.sea[i], t)),
    cap: mixColor(from.cap, to.cap, t),
    ambient: mixColor(from.ambient, to.ambient, t),
    cloud: mixColor(from.cloud, to.cloud, t),
    cloudShade: mixColor(from.cloudShade, to.cloudShade, t),
    sun: mixColor(from.sun, to.sun, t),
    night: from.night + (to.night - from.night) * t,
  };
}

export function isNight(rawHour) {
  const hour = normalizeHour(rawHour);
  return hour < 5.75 || hour >= 19.25;
}

// Posição do astro visível: t vai de 0 (nascente) a 1 (poente).
export function celestialBody(rawHour) {
  const hour = normalizeHour(rawHour);
  if (hour >= 5.75 && hour < 19.25) return { kind: 'sun', t: (hour - 5.75) / 13.5 };
  const sinceDusk = hour >= 19.25 ? hour - 19.25 : hour + 4.75;
  return { kind: 'moon', t: sinceDusk / 10.5 };
}

export function currentHour(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60;
}
