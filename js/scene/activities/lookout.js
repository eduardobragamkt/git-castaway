// Olhar o horizonte e usar a luneta.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* horizon(a) {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('shadeEyes', a.between(2, 3.5));
  yield cycle(['waveA', 'waveB'], 2.5, 1.4);
  yield hold('stand', 0.4);
}

export function* lookThrough(seconds) {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, item: 'spyglass', mood: 'focused' });
  yield hold('spyglass', seconds);
}

export function* spyNothing() {
  yield* lookThrough(3);
  yield set({ item: null, mood: 'sad' });
  yield hold('shrug', 1);
  yield set({ mood: 'calm' });
}

export function* spyWhale() {
  yield* lookThrough(1);
  yield emit('visitor:whale');
  yield hold('spyglass', 3.4);
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield set({ mood: 'calm' });
}

export function* spyWrongEnd() {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, item: 'spyglassBackwards', mood: 'surprised' });
  yield hold('spyglass', 1.8);
  yield set({ item: null, mood: 'focused' });
  yield hold('scratchHead', 1);
  yield* lookThrough(1.6);
  yield set({ item: null, mood: 'calm' });
}
