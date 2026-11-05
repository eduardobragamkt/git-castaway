// Projetos de longo prazo: o jardim e a jangada que nunca fica pronta.

import { SCENE_SPOTS, cycle, dazed, emit, hold, set, walk } from './steps.js';

export function* gardenWater() {
  yield walk(SCENE_SPOTS.garden);
  yield set({ facing: -1, item: 'wateringCan', mood: 'focused' });
  yield emit('waterDrops');
  yield cycle(['writeA', 'writeB'], 1, 3.4);
  yield set({ item: null, mood: 'happy' });
  yield hold('hips', 1);
  yield set({ mood: 'calm' });
}

export function* gardenTend() {
  yield walk(SCENE_SPOTS.garden);
  yield set({ facing: -1, mood: 'focused' });
  yield hold('kneel', 0.5);
  yield cycle(['kneelPatA', 'kneelPatB'], 1.4, 3.2);
  yield set({ mood: 'happy' });
  yield hold('wipeBrow', 1);
  yield set({ mood: 'calm' });
}

export function* raftBuild(a) {
  yield walk(SCENE_SPOTS.raftSide);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(3.5, 6));
  yield set({ item: null, mood: 'happy' });
  yield hold('hips', 1.2);
  yield set({ mood: 'calm' });
}

export function* raftCollapse(a) {
  yield walk(SCENE_SPOTS.raftSide);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(2, 3));
  yield emit('raftWreck');
  yield set({ item: null, mood: 'surprised' });
  yield hold('stand', 1.1);
  yield set({ mood: 'sad' });
  yield hold('facepalm', 1.3);
  yield set({ mood: 'calm' });
}

export function* raftTest(a) {
  yield walk(SCENE_SPOTS.raftSide);
  yield set({ facing: -1, mood: 'focused' });
  yield cycle(['shakeA', 'shakeB'], 3, 1.2);
  yield emit('raftLaunch');
  yield set({ mood: 'happy' });
  yield walk(SCENE_SPOTS.seaLeft);
  yield set({ facing: -1 });
  yield hold('armsUp', 1.1);
  yield emit('raftSink');
  yield set({ mood: 'surprised', effect: 'splash' });
  yield hold('stand', 0.9);
  yield set({ facing: 1, mood: 'sad' });
  yield cycle(['swimA', 'swimB'], 2.2, 1.6);
  yield set({ effect: null });
  yield walk(SCENE_SPOTS.beachLeft);
  yield* dazed(a);
}
