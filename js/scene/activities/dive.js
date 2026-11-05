// Mergulho a partir da palmeira.

import { SCENE_SPOTS, cycle, dazed, emit, hold, leap, set, walk } from './steps.js';

export function* climbForDive() {
  yield walk(SCENE_SPOTS.trunk);
  yield set({ facing: -1, mood: 'focused' });
  yield cycle(['climbA', 'climbB'], 2.4, 2.2, { lift: 20 });
  yield set({ mood: 'happy' });
  yield hold('climbA', 0.5);
}

export function* swimBack(a) {
  yield emit('splash');
  yield set({ lift: 0, effect: 'splash', facing: 1 });
  yield cycle(['swimA', 'swimB'], 2.2, a.between(1.5, 2.5));
  yield set({ effect: null });
  yield walk(SCENE_SPOTS.beachLeft);
}

export function* diveClean(a) {
  yield* climbForDive();
  yield leap(SCENE_SPOTS.seaLeft, 30, 1.1, 'dive');
  yield* swimBack(a);
  yield set({ mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield set({ mood: 'calm' });
}

export function* diveBellyFlop(a) {
  yield* climbForDive();
  yield leap(SCENE_SPOTS.seaLeft, 26, 1, 'bellyFlop');
  yield set({ mood: 'dizzy' });
  yield* swimBack(a);
  yield* dazed(a);
}
