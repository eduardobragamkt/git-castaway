// Passeios e piadas curtas.

import { SCENE_SPOTS, cycle, dazed, emit, hold, set, walk } from './steps.js';

export function* walkTiptoe() {
  yield walk(SCENE_SPOTS.beachRight);
  yield set({ mood: 'surprised', effect: 'sweat', facing: -1 });
  yield cycle(['hopA', 'hopB'], 4, 1.5);
  yield walk(SCENE_SPOTS.stroll, { run: true });
  yield set({ mood: 'calm', effect: null });
  yield hold('stand', 0.4);
}

export function* walkTrip(a) {
  yield walk(SCENE_SPOTS.beachLeft);
  yield set({ mood: 'surprised' });
  yield hold('fallBack', 0.8);
  yield* dazed(a);
}

export function* walkWhistle() {
  yield set({ mood: 'happy', effect: 'notes' });
  yield walk(SCENE_SPOTS.beachRight);
  yield hold('whistle', 1.4);
  yield walk(SCENE_SPOTS.stroll);
  yield set({ mood: 'calm', effect: null });
}

export function* gagSlip(a) {
  yield walk(SCENE_SPOTS.castle);
  yield emit('banana');
  yield walk(SCENE_SPOTS.bottle);
  yield set({ mood: 'surprised' });
  yield hold('fallBack', 0.7);
  yield* dazed(a);
}

export function* gagSneeze() {
  yield walk(SCENE_SPOTS.stroll);
  yield set({ mood: 'focused' });
  yield hold('sniff', 1);
  yield hold('sniff', 0.8);
  yield set({ mood: 'surprised', effect: 'dust' });
  yield cycle(['sneezeA', 'sneezeB'], 3, 1);
  yield set({ mood: 'calm', effect: null });
  yield hold('shrug', 0.8);
}
