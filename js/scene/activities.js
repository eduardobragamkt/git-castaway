// O que o náufrago faz na cena. Cada atividade é um gerador: lê-se como um roteiro,
// e o ator executa um passo por vez. O sorteador escolhe conforme energia, hora e estrelas.

import { hasUpgrade } from '../upgrades.js';

export const SCENE_SPOTS = {
  center: { x: 8, y: 42 },
  shore: { x: 124, y: 46 },
  bench: { x: -38, y: 45 },
  board: { x: -4, y: 36 },
  castle: { x: 38, y: 50 },
  palm: { x: -76, y: 38 },
  fire: { x: -40, y: 51 },
  rest: { x: 24, y: 47 },
  horizon: { x: 112, y: 40 },
  bottle: { x: 116, y: 52 },
  crate: { x: 54, y: 42 },
};

const walk = (spot) => ({ walk: spot });
const hold = (pose, seconds = 0.5) => ({ pose, seconds });
const cycle = (poses, hz, seconds) => ({ cycle: poses, hz, seconds });
const set = (props) => ({ set: props });
const emit = (event) => ({ emit: event });

function* fish(a) {
  yield walk(SCENE_SPOTS.shore);
  yield set({ facing: 1, item: 'rod', mood: 'calm' });
  yield hold('sitFish', 0.7);
  yield cycle(['sitFish', 'sitFishTug'], 0.55, a.between(6, 12));
  yield set({ mood: 'surprised' });
  yield cycle(['sitFish', 'sitFishTug'], 4, 0.8);
  yield set({ item: 'fish', mood: 'happy' });
  yield hold('showFish', 2);
  yield set({ item: null, mood: 'calm' });
}

function* hammer(a) {
  yield walk(SCENE_SPOTS.bench);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(5, 9));
  yield set({ item: null, mood: 'calm' });
  yield hold('wipeBrow', 1.3);
  yield set({ item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(3, 6));
  yield set({ item: null, mood: 'happy' });
  yield hold('stand', 0.8);
  yield set({ mood: 'calm' });
}

function* commitBoard(a) {
  yield walk(SCENE_SPOTS.board);
  yield set({ facing: -1, item: 'stick', mood: 'focused' });
  yield cycle(['writeA', 'writeB'], 2, a.between(3, 5));
  yield emit('commit');
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 1);
  yield set({ mood: 'calm' });
}

function* sandcastle(a) {
  yield walk(SCENE_SPOTS.castle);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('kneel', 0.5);
  yield cycle(['kneelPatA', 'kneelPatB'], 1.8, a.between(4, 7));
  yield emit('castle');
  yield set({ mood: 'happy' });
  yield hold('sit', 1.5);
  yield set({ mood: 'calm' });
}

function* coconut() {
  yield walk(SCENE_SPOTS.palm);
  yield set({ facing: -1, mood: 'focused' });
  yield cycle(['shakeA', 'shakeB'], 3.5, 1.6);
  yield emit('coconut');
  yield set({ mood: 'surprised' });
  yield hold('stand', 0.9);
  yield set({ item: 'coconut', mood: 'happy' });
  yield hold('drink', 2);
  yield set({ item: null, mood: 'calm' });
}

function* horizon(a) {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('shadeEyes', a.between(2.5, 4.5));
  yield cycle(['waveA', 'waveB'], 2.5, 1.6);
  yield hold('stand', 0.5);
}

function* stretch() {
  yield set({ mood: 'sleepy' });
  yield hold('armsUp', 1.1);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

function* dance(a) {
  yield walk(SCENE_SPOTS.center);
  yield set({ mood: 'happy', effect: 'notes' });
  yield cycle(['danceA', 'danceB'], 2.4, a.between(3, 5));
  yield set({ mood: 'calm', effect: null });
}

function* sleep(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'sleepy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'asleep', effect: 'zzz' });
  yield cycle(['sleepA', 'sleepB'], 0.3, a.between(10, 18));
  yield set({ mood: 'sleepy', effect: null });
  yield hold('sit', 0.8);
}

function* sad(a) {
  yield walk(SCENE_SPOTS.castle);
  yield set({ facing: 1, mood: 'sad' });
  yield cycle(['sadA', 'sadB'], 0.35, a.between(5, 9));
  yield set({ mood: 'calm' });
}

function* stargaze(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('stargaze', a.between(6, 10));
  yield emit('shootingStar');
  yield set({ mood: 'surprised' });
  yield hold('stargaze', 1.6);
  yield set({ mood: 'happy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}

function* warmHands(a) {
  yield walk(SCENE_SPOTS.fire);
  yield set({ facing: 1, mood: 'calm' });
  yield cycle(['warmA', 'warmB'], 0.5, a.between(6, 10));
}

// weight devolve 0 quando a atividade não cabe no momento.
export const ACTIVITIES = {
  fish: { run: fish, weight: ({ energy }) => ({ pescando: 6, trabalhando: 2 })[energy] ?? 0 },
  hammer: { run: hammer, weight: ({ energy }) => ({ trabalhando: 6, pescando: 1 })[energy] ?? 0 },
  commitBoard: { run: commitBoard, weight: ({ energy, commits }) => (energy !== 'dormindo' && commits > 0 ? 3 : 0) },
  sandcastle: { run: sandcastle, weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 2 : 0) },
  coconut: { run: coconut, weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 2 : 0) },
  horizon: { run: horizon, weight: ({ energy, night }) => (night ? 0 : energy === 'dormindo' ? 1 : 2) },
  stretch: { run: stretch, weight: () => 1 },
  dance: { run: dance, weight: ({ energy }) => (energy === 'trabalhando' ? 2 : 0) },
  sleep: { run: sleep, weight: ({ energy, night }) => (energy === 'dormindo' ? 6 : night ? 2 : 0) },
  sad: { run: sad, weight: ({ energy }) => (energy === 'dormindo' ? 4 : 0) },
  stargaze: { run: stargaze, weight: ({ energy, night }) => (night && energy !== 'dormindo' ? 3 : 0) },
  warmHands: {
    run: warmHands,
    weight: ({ energy, stars, night }) => (night && energy !== 'dormindo' && hasUpgrade(stars, 'fogueira') ? 3 : 0),
  },
};

// Sorteio ponderado que não repete a atividade anterior quando há outra opção.
export function pickActivity(context, last, random = Math.random) {
  const available = Object.keys(ACTIVITIES)
    .map((name) => [name, ACTIVITIES[name].weight(context)])
    .filter(([, weight]) => weight > 0);
  const fresh = available.filter(([name]) => name !== last);
  const pool = fresh.length > 0 ? fresh : available;
  let roll = random() * pool.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [name, weight] of pool) {
    roll -= weight;
    if (roll < 0) return name;
  }
  return pool[pool.length - 1][0];
}

export function* collectBottle(onPickUp, onReadStart, onReadEnd) {
  yield set({ item: null, effect: null, mood: 'surprised' });
  yield walk(SCENE_SPOTS.bottle);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('bend', 0.7);
  yield emit(onPickUp);
  yield set({ item: 'paper', mood: 'focused' });
  yield hold('read', 0.4);
  yield emit(onReadStart);
  yield hold('read', 7);
  yield emit(onReadEnd);
  yield set({ item: null, mood: 'happy' });
  yield hold('stand', 0.8);
  yield set({ mood: 'calm' });
}

export function* celebrateCrate() {
  yield set({ item: null, effect: null, mood: 'surprised' });
  yield hold('stand', 1.4);
  yield walk(SCENE_SPOTS.crate);
  yield set({ facing: 1, mood: 'happy' });
  yield cycle(['armsUp', 'stand'], 2, 2);
  yield set({ mood: 'calm' });
}
