// Pesca: todas as versões começam na beira da água.

import { SCENE_SPOTS, biteAlert, castLine, cycle, dazed, emit, hold, set, walk } from './steps.js';

export function* fishSmall(a) {
  yield* castLine(a, 5, 9);
  yield* biteAlert();
  yield set({ item: 'fish', mood: 'happy' });
  yield hold('showFish', 2);
  yield set({ item: null, mood: 'calm' });
}

export function* fishBoot(a) {
  yield* castLine(a, 4, 7);
  yield* biteAlert();
  yield set({ item: 'boot', mood: 'surprised' });
  yield hold('showFish', 1.4);
  yield set({ mood: 'sad' });
  yield hold('showFish', 1.2);
  yield set({ item: null, mood: 'calm' });
}

export function* fishTumble(a) {
  yield* castLine(a, 3, 6);
  yield* biteAlert();
  yield cycle(['sitFishTug', 'sitFish'], 6, 0.9);
  yield set({ item: null });
  yield hold('fallBack', 0.9);
  yield* dazed(a);
}

export function* fishBait(a) {
  yield* castLine(a, 4, 7);
  yield* biteAlert();
  yield set({ item: 'hook', mood: 'sad' });
  yield hold('showFish', 1.8);
  yield hold('scratchHead', 1);
  yield set({ item: null, mood: 'calm' });
}

export function* fishNap(a) {
  yield* castLine(a, 2, 3);
  yield set({ mood: 'asleep', effect: 'zzz' });
  yield cycle(['sitFish', 'sitFishNod'], 0.5, a.between(5, 8));
  yield set({ effect: null, mood: 'surprised' });
  yield hold('sitFish', 0.8);
  yield set({ item: null, mood: 'calm' });
}

export function* fishGull(a) {
  yield* castLine(a, 4, 7);
  yield* biteAlert();
  yield set({ item: 'fish', mood: 'happy' });
  yield emit('gull');
  yield hold('showFish', 1.3);
  yield set({ item: null, mood: 'surprised' });
  yield emit('gullFlee');
  yield hold('showFish', 0.7);
  yield set({ mood: 'sad', effect: 'angry' });
  yield cycle(['fistA', 'fistB'], 3, 1.8);
  yield set({ mood: 'calm', effect: null });
}

export function* fishSpit(a) {
  yield* castLine(a, 3, 6);
  yield* biteAlert();
  yield emit('spit');
  yield set({ item: null, mood: 'surprised', effect: 'sweat' });
  yield hold('sitFishTug', 1);
  yield hold('wipeBrow', 1.4);
  yield set({ mood: 'calm', effect: null });
}

export function* fishFin(a) {
  yield* castLine(a, 3, 5);
  yield emit('fin');
  yield hold('sitFish', 1.6);
  yield set({ item: null, mood: 'surprised' });
  yield hold('jumpUp', 0.4);
  yield walk(SCENE_SPOTS.horizon, { run: true });
  yield set({ facing: 1, effect: 'sweat' });
  yield hold('shadeEyes', 1.6);
  yield set({ mood: 'calm', effect: null });
}
