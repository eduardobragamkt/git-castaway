// Garrafas que chegam do mar.

import { SCENE_SPOTS, emit, hold, set, walk } from './steps.js';

// Tomada da abertura: a mesma garrafa, sem balão, para o texto do terminal aparecer.
export function* introBottle() {
  yield emit('bottleArrive');
  yield set({ item: null, effect: null, mood: 'surprised', facing: 1 });
  yield hold('stand', 0.4);
  yield walk(SCENE_SPOTS.bottle);
  yield set({ mood: 'calm' });
  yield hold('bend', 0.5);
  yield emit('bottlePick');
  yield set({ item: 'paper', mood: 'focused' });
  yield hold('read', 1.6);
  yield set({ item: null, mood: 'happy' });
  yield hold('stand', 0.4);
  yield set({ mood: 'calm' });
}

// A garrafa chega do mar sozinha, com uma mensagem do catálogo.
export function* bottleFromSea() {
  yield emit('bottleArrive');
  yield set({ item: null, mood: 'surprised' });
  yield walk(SCENE_SPOTS.bottle);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('bend', 0.7);
  yield emit('bottlePick');
  yield set({ item: 'paper', mood: 'focused' });
  yield hold('read', 0.4);
  yield emit('bottleOpen');
  yield hold('read', 6);
  yield emit('bottleClose');
  yield set({ item: null, mood: 'happy' });
  yield hold('stand', 0.8);
  yield set({ mood: 'calm' });
}
