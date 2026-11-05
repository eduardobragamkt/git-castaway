// Vida na praia: castelo, passeio, banho de sol, banho de mar e corrida.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* buildCastle(a) {
  yield walk(SCENE_SPOTS.castle);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('kneel', 0.5);
  yield cycle(['kneelPatA', 'kneelPatB'], 1.8, a.between(3, 5));
  yield emit('castle');
}

export function* castleProud(a) {
  yield* buildCastle(a);
  yield set({ mood: 'happy' });
  yield hold('sit', 1.5);
  yield set({ mood: 'calm' });
}

export function* castleWave(a) {
  yield* buildCastle(a);
  yield set({ mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield emit('waveWipe');
  yield set({ mood: 'surprised' });
  yield hold('stand', 1);
  yield set({ mood: 'sad' });
  yield hold('sit', 1.6);
  yield set({ mood: 'calm' });
}

export function* stroll(a) {
  yield walk(SCENE_SPOTS.stroll);
  yield set({ mood: 'calm', facing: a.random() > 0.5 ? 1 : -1 });
  yield hold('stand', 0.8);
  yield hold('lookUp', a.between(1, 2));
  yield walk(SCENE_SPOTS.beachRight);
  yield hold('shadeEyes', 1);
}

export function* sunbathe(a) {
  yield walk(SCENE_SPOTS.sun);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('sit', 0.5);
  yield set({ mood: 'asleep' });
  yield hold('sunbathe', a.between(5, 9));
  yield set({ mood: 'happy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}

export function* bathe(a) {
  yield walk(SCENE_SPOTS.shore);
  yield walk(SCENE_SPOTS.sea);
  yield set({ facing: 1, mood: 'happy', effect: 'splash' });
  yield cycle(['washA', 'washB'], 2.5, a.between(3, 5));
  yield set({ effect: null });
  yield hold('armsUp', 0.7);
  yield walk(SCENE_SPOTS.shore);
  yield hold('wipeBrow', 0.8);
  yield set({ mood: 'calm' });
}

export function* jog(a) {
  const [first, second] = a.random() > 0.5
    ? [SCENE_SPOTS.beachLeft, SCENE_SPOTS.beachRight]
    : [SCENE_SPOTS.beachRight, SCENE_SPOTS.beachLeft];
  yield set({ mood: 'focused' });
  yield walk(first, { run: true });
  yield walk(second, { run: true });
  yield set({ mood: 'happy', effect: 'sweat' });
  yield hold('bend', 1.3);
  yield hold('wipeBrow', 0.8);
  yield set({ mood: 'calm', effect: null });
}
