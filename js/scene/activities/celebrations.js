// Comemorações de estrelas e marcos do repositório.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

// Comemoração de um marco real do repositório.
export function* celebrateMilestone(onStart, onEnd) {
  yield set({ item: null, effect: null, mood: 'surprised', lift: 0 });
  yield walk(SCENE_SPOTS.center);
  yield set({ facing: 1, mood: 'happy', effect: 'notes' });
  yield emit('confetti');
  yield emit(onStart);
  yield cycle(['armsUp', 'danceA', 'armsUp', 'danceB'], 1.6, 5.5);
  yield emit(onEnd);
  yield set({ mood: 'calm', effect: null });
  yield hold('stand', 0.5);
}

export function* celebrateCrate() {
  yield set({ item: null, effect: null, mood: 'surprised', lift: 0 });
  yield hold('stand', 1.4);
  yield walk(SCENE_SPOTS.crate);
  yield set({ facing: 1, mood: 'happy' });
  yield cycle(['armsUp', 'stand'], 2, 2);
  yield set({ mood: 'calm' });
}
