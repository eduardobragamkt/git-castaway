// Pausas curtas entre as ações, abertura e encerramento de cada sessão.

import { SCENE_SPOTS, cycle, hold, set, walk } from './steps.js';

export function* beatScratch() {
  yield set({ mood: 'calm' });
  yield hold('scratchHead', 1.6);
  yield hold('stand', 0.5);
}

export function* beatLookAround(a) {
  yield set({ mood: 'calm', facing: -a.facing });
  yield hold('stand', 1);
  yield set({ facing: -a.facing });
  yield hold('stand', 1);
}

export function* beatYawn() {
  yield set({ mood: 'sleepy' });
  yield hold('yawn', 1.8);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

export function* beatKick() {
  yield set({ mood: 'calm' });
  yield cycle(['kickA', 'kickB'], 1.5, 2);
  yield hold('stand', 0.3);
}

export function* beatSigh() {
  yield set({ mood: 'sad' });
  yield hold('bend', 1.6);
  yield hold('stand', 1);
}

export function* beatHips() {
  yield set({ mood: 'calm' });
  yield hold('hips', 2.2);
}

export function* beatWhistle() {
  yield set({ mood: 'happy', effect: 'notes' });
  yield hold('whistle', 2.4);
  yield set({ mood: 'calm', effect: null });
}

export function* beatWrist() {
  yield set({ mood: 'focused' });
  yield hold('checkWrist', 1.5);
  yield set({ mood: 'sad' });
  yield hold('shrug', 0.9);
  yield set({ mood: 'calm' });
}

export function* beatSwat() {
  yield set({ mood: 'focused' });
  yield cycle(['swatA', 'swatB'], 2.8, 1.8);
  yield set({ mood: 'calm' });
}

export function* beatTap() {
  yield set({ mood: 'calm' });
  yield cycle(['tapA', 'tapB'], 2.5, 2);
}

export function* beatBack() {
  yield set({ mood: 'sad' });
  yield hold('backStretch', 1.7);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.4);
}

export function* beatFacepalm() {
  yield set({ mood: 'sad' });
  yield hold('facepalm', 1.6);
  yield set({ mood: 'calm' });
}

export function* beatSniff() {
  yield set({ mood: 'focused' });
  yield hold('sniff', 1.6);
  yield set({ mood: 'calm' });
}

export function* beatShrug() {
  yield set({ mood: 'calm' });
  yield hold('shrug', 1.5);
}

export function* openingScript() {
  yield set({ mood: 'sleepy' });
  yield hold('yawn', 2);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

export function* closingScript(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('sit', a.between(3, 6));
  yield hold('stand', 0.5);
}

export const PAUSE_BEATS = [
  beatScratch,
  beatLookAround,
  beatYawn,
  beatKick,
  beatSigh,
  beatHips,
  beatWhistle,
  beatWrist,
  beatSwat,
  beatTap,
  beatBack,
  beatFacepalm,
  beatSniff,
  beatShrug,
];

export const SLEEPY_BEATS = [beatYawn, beatSigh, beatBack, beatFacepalm];

export function pauseBeat(actor) {
  const beats = actor.energy === 'sleeping' ? SLEEPY_BEATS : PAUSE_BEATS;
  return beats[Math.floor(actor.random() * beats.length)](actor);
}
