// Pedidos de ajuda: nunca funcionam, e essa é a graça.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* helpSand() {
  yield walk(SCENE_SPOTS.sos);
  yield set({ facing: 1, mood: 'focused' });
  for (let letter = 0; letter < 3; letter += 1) {
    yield cycle(['kneelPatA', 'kneelPatB'], 1.8, 1.1);
    yield emit('sosLetter');
  }
  yield set({ mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield emit('sosWave');
  yield set({ mood: 'surprised' });
  yield hold('stand', 0.9);
  yield set({ mood: 'sad' });
  yield hold('facepalm', 1.1);
  yield set({ mood: 'calm' });
}

export function* helpBottle() {
  yield walk(SCENE_SPOTS.throwing);
  yield set({ facing: -1, item: 'paper', mood: 'focused' });
  yield hold('read', 1.8);
  yield hold('throwBack', 0.4);
  yield set({ item: null });
  yield emit('throwBottle');
  yield hold('throwForward', 0.5);
  yield set({ mood: 'calm' });
  yield hold('shadeEyes', 2);
}

export function* helpWave() {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, mood: 'focused' });
  yield cycle(['waveA', 'waveB'], 3, 2.6);
  yield set({ mood: 'sad' });
  yield hold('shrug', 1.2);
  yield set({ mood: 'calm' });
}
