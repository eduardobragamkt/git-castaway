// Fogo: acender, se aquecer e assar peixe.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* rubSticks(seconds) {
  yield walk(SCENE_SPOTS.fire);
  yield set({ facing: 1, item: 'sticks', mood: 'focused' });
  yield cycle(['rubA', 'rubB'], 3.2, seconds);
}

export function* fireFails() {
  yield* rubSticks(3.2);
  yield emit('smoke');
  yield set({ item: null, mood: 'sad', effect: 'sweat' });
  yield hold('kneel', 1.6);
  yield hold('facepalm', 1);
  yield set({ mood: 'calm', effect: null });
}

export function* fireBurnsHand() {
  yield* rubSticks(2.6);
  yield emit('spark');
  yield set({ item: null, mood: 'surprised', effect: 'stars' });
  yield cycle(['hopA', 'hopB'], 3.5, 1.7);
  yield set({ mood: 'sad', effect: null });
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

export function* fireLights() {
  yield* rubSticks(3.8);
  yield emit('fireLit');
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 1.2);
  yield cycle(['warmA', 'warmB'], 0.5, 3.5);
  yield set({ mood: 'calm' });
}

export function* warmHands(a) {
  yield walk(SCENE_SPOTS.fire);
  yield set({ facing: 1, mood: 'calm' });
  yield cycle(['warmA', 'warmB'], 0.5, a.between(5, 8));
}

export function* cookFish(a) {
  yield walk(SCENE_SPOTS.fire);
  yield set({ facing: 1, item: 'cooking', mood: 'focused' });
  yield cycle(['cookA', 'cookB'], 0.8, a.between(4, 7));
  yield set({ mood: 'happy', item: 'cooked' });
  yield hold('eat', 1.8);
  yield set({ item: null, mood: 'calm' });
}
