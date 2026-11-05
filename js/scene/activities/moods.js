// Humores: espreguiçar, dançar, dormir, ficar triste e olhar as estrelas.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* stretch() {
  yield set({ mood: 'sleepy' });
  yield hold('armsUp', 1.1);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

export function* dance(a) {
  yield walk(SCENE_SPOTS.center);
  yield set({ mood: 'happy', effect: 'notes' });
  yield cycle(['danceA', 'danceB'], 2.4, a.between(3, 5));
  yield set({ mood: 'calm', effect: null });
}

export function* sleep(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'sleepy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'asleep', effect: 'zzz' });
  yield cycle(['sleepA', 'sleepB'], 0.3, a.between(8, 14));
  yield set({ mood: 'sleepy', effect: null });
  yield hold('sit', 0.8);
}

export function* sad(a) {
  yield walk(SCENE_SPOTS.castle);
  yield set({ facing: 1, mood: 'sad' });
  yield cycle(['sadA', 'sadB'], 0.35, a.between(5, 9));
  yield set({ mood: 'calm' });
}

export function* stargaze(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('stargaze', a.between(5, 8));
  yield emit('shootingStar');
  yield set({ mood: 'surprised' });
  yield hold('stargaze', 1.6);
  yield set({ mood: 'happy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}
