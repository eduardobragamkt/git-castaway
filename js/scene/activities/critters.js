// Bichos e o humor do Git: caranguejos, polvo da poça, bugs e merge conflict.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* crabWake(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'asleep', effect: 'zzz' });
  yield cycle(['sleepA', 'sleepB'], 0.3, a.between(4, 6));
  yield emit('crab');
  yield cycle(['sleepA', 'sleepB'], 0.3, 1.9);
  yield set({ mood: 'surprised', effect: 'stars' });
  yield emit('crabFlee');
  yield cycle(['hopA', 'hopB'], 3.5, 1.6);
  yield set({ mood: 'sad', effect: null });
  yield hold('sit', 1.2);
}

export function* crabPinch() {
  yield walk(SCENE_SPOTS.sun);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('shadeEyes', 1);
  yield emit('crab');
  yield hold('stand', 1.9);
  yield set({ mood: 'surprised', effect: 'stars' });
  yield emit('crabFlee');
  yield cycle(['hopA', 'hopB'], 3.5, 1.8);
  yield set({ mood: 'sad', effect: 'angry' });
  yield cycle(['fistA', 'fistB'], 3, 1.1);
  yield set({ mood: 'calm', effect: null });
}

export function* poolSquirt() {
  yield walk(SCENE_SPOTS.pool);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('bend', 1.4);
  yield emit('squirt');
  yield hold('bend', 0.4);
  yield set({ mood: 'surprised', effect: 'ink' });
  yield cycle(['hopA', 'hopB'], 3, 1.3);
  yield set({ mood: 'sad' });
  yield hold('wipeBrow', 1.2);
  yield set({ mood: 'calm', effect: null });
}

export function* bugsInvasion() {
  yield walk(SCENE_SPOTS.bugs);
  yield emit('bugsSpawn');
  yield set({ mood: 'surprised', facing: 1 });
  yield hold('stand', 0.9);
  yield set({ item: 'hammer', mood: 'focused' });
  for (let swing = 0; swing < 4; swing += 1) {
    yield cycle(['hammerUp', 'hammerDown'], 2.4, 0.85);
    yield emit('bugSquash');
  }
  yield emit('bugsFlee');
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 1);
  yield set({ mood: 'calm' });
}

export function* mergeConflict() {
  yield walk(SCENE_SPOTS.conflict);
  yield emit('conflictStart');
  yield set({ facing: 1, mood: 'surprised' });
  yield hold('stand', 1.6);
  yield set({ mood: 'focused' });
  yield hold('scratchHead', 1.4);
  yield cycle(['waveA', 'waveB'], 2.5, 1.6);
  yield emit('conflictEnd');
  yield set({ mood: 'happy' });
  yield hold('shrug', 1.1);
  yield set({ mood: 'calm' });
}
