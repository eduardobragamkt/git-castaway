// Bancada e quadro de commits.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* hammerSteady(a) {
  yield walk(SCENE_SPOTS.bench);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(3, 5));
  yield set({ item: null, mood: 'calm', effect: 'sweat' });
  yield hold('wipeBrow', 1.2);
  yield set({ mood: 'happy', effect: null });
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

export function* hammerThumb(a) {
  yield walk(SCENE_SPOTS.bench);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(2, 3.5));
  yield set({ item: null, mood: 'surprised', effect: 'stars' });
  yield cycle(['hopA', 'hopB'], 3.5, 2);
  yield set({ mood: 'sad', effect: null });
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

export function* atBench(item) {
  yield walk(SCENE_SPOTS.bench);
  yield set({ facing: -1, item, mood: 'focused' });
}

export function* benchSaw(a) {
  yield* atBench('saw');
  yield set({ effect: 'dust' });
  yield cycle(['sawA', 'sawB'], 2.8, a.between(3, 5));
  yield set({ item: null, effect: 'sweat', mood: 'happy' });
  yield hold('wipeBrow', 1);
  yield set({ mood: 'calm', effect: null });
}

export function* benchPlank() {
  yield* atBench('plank');
  yield hold('showFish', 0.9);
  yield set({ mood: 'surprised', item: null });
  yield emit('plankFall');
  yield hold('stand', 0.4);
  yield set({ effect: 'stars', mood: 'sad' });
  yield cycle(['hopA', 'hopB'], 3.5, 1.8);
  yield set({ mood: 'calm', effect: null });
}

export function* benchCollapse(a) {
  yield* atBench('hammer');
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(2, 3));
  yield emit('benchCollapse');
  yield set({ item: null, mood: 'surprised' });
  yield hold('stand', 1.2);
  yield set({ mood: 'sad' });
  yield hold('scratchHead', 1.2);
  yield hold('facepalm', 1);
  yield set({ mood: 'calm' });
}

export function* benchMeasure() {
  yield* atBench('ruler');
  yield cycle(['writeA', 'writeB'], 0.9, 2.6);
  yield set({ item: null });
  yield hold('scratchHead', 1.2);
  yield set({ item: 'ruler' });
  yield cycle(['writeA', 'writeB'], 0.9, 1.8);
  yield set({ item: null, mood: 'happy' });
  yield hold('hips', 0.9);
  yield set({ mood: 'calm' });
}

export function* benchPaint() {
  yield walk(SCENE_SPOTS.board);
  yield set({ facing: -1, item: 'brush', mood: 'focused' });
  yield cycle(['writeA', 'writeB'], 1.6, 3.4);
  yield emit('paintBoard');
  yield set({ item: null, mood: 'happy' });
  yield hold('hips', 1.2);
  yield set({ mood: 'calm' });
}

export function* commitBoard(a) {
  yield walk(SCENE_SPOTS.board);
  yield set({ facing: -1, item: 'stick', mood: 'focused' });
  yield cycle(['writeA', 'writeB'], 2, a.between(2.5, 4));
  yield emit('commit');
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 1);
  yield set({ mood: 'calm' });
}
