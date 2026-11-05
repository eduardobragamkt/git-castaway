// Leitura, com e sem a gaivota.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* openBook() {
  yield walk(SCENE_SPOTS.reading);
  yield set({ facing: 1, item: 'book', mood: 'focused' });
  yield hold('readSit', 0.6);
}

export function* readCalm(a) {
  yield* openBook();
  yield cycle(['readSit', 'readPage'], 0.45, a.between(5, 8));
  yield set({ item: null, mood: 'happy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}

export function* readNap(a) {
  yield* openBook();
  yield cycle(['readSit', 'readPage'], 0.45, 2.5);
  yield set({ item: 'bookFace', mood: 'asleep', effect: 'zzz' });
  yield hold('sleepA', a.between(4, 6));
  yield set({ item: null, mood: 'surprised', effect: null });
  yield hold('sit', 0.9);
  yield set({ mood: 'calm' });
}

export function* readGullPerch(a) {
  yield* openBook();
  yield cycle(['readSit', 'readPage'], 0.45, 1.5);
  yield emit('gullPerch');
  yield cycle(['readSit', 'readPage'], 0.45, a.between(4, 6));
  yield set({ mood: 'surprised' });
  yield hold('lookUp', 0.8);
  yield emit('gullLeave');
  yield set({ item: null, mood: 'sad' });
  yield hold('facepalm', 0.9);
  yield set({ mood: 'calm' });
}

export function* readGullBath(a) {
  yield* openBook();
  yield emit('gullBath');
  yield cycle(['readSit', 'readPage'], 0.45, a.between(5, 7));
  yield set({ item: null, mood: 'happy' });
  yield hold('sit', 0.7);
  yield emit('gullLeave');
  yield set({ mood: 'calm' });
}

export function* readGullStays(a) {
  yield* openBook();
  yield emit('gullPerch');
  yield cycle(['readSit', 'readPage'], 0.45, a.between(3, 5));
  yield set({ item: null, mood: 'calm' });
  yield emit('gullToBoard');
  yield hold('sit', 0.6);
  yield hold('shrug', 1);
}
