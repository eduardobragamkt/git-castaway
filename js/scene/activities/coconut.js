// Coco: quase sempre o coco vence.

import { SCENE_SPOTS, cycle, dazed, emit, hold, set, walk } from './steps.js';

export function* shakeTrunk(seconds) {
  yield walk(SCENE_SPOTS.palm);
  yield set({ facing: 1, mood: 'focused' });
  yield cycle(['shakeA', 'shakeB'], 3.5, seconds);
}

export function* coconutShake() {
  yield* shakeTrunk(2.4);
  yield set({ mood: 'sad', effect: 'sweat' });
  yield hold('lookUp', 1.2);
  yield hold('scratchHead', 1);
  yield set({ mood: 'calm', effect: null });
}

export function* coconutJump() {
  yield walk(SCENE_SPOTS.palm);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('lookUp', 0.7);
  yield cycle(['jumpCrouch', 'jumpUp'], 2.6, 2.8);
  yield set({ mood: 'sad', effect: 'sweat' });
  yield hold('bend', 1.1);
  yield set({ mood: 'calm', effect: null });
}

export function* coconutStone(a) {
  yield walk(SCENE_SPOTS.palm);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('bend', 0.5);
  yield set({ item: 'stone' });
  yield hold('lookUp', 0.6);
  yield hold('throwBack', 0.35);
  yield set({ item: null });
  yield emit('stoneThrow');
  yield hold('throwForward', 0.4);
  yield set({ mood: 'surprised' });
  yield hold('lookUp', 0.8);
  yield* dazed(a);
}

export function* coconutClimb(a) {
  yield walk(SCENE_SPOTS.trunk);
  yield set({ facing: -1, mood: 'focused' });
  yield cycle(['climbA', 'climbB'], 2.4, 2.4, { lift: 20 });
  yield set({ mood: 'surprised' });
  yield hold('climbA', 0.5);
  yield hold('climbB', 0.35, { lift: 0 });
  yield* dazed(a);
}

export function* coconutOnHead(a) {
  yield* shakeTrunk(1.3);
  yield hold('lookUp', 0.3);
  yield emit('coconutHead');
  yield hold('lookUp', 0.5);
  yield* dazed(a);
  yield set({ item: 'coconut', mood: 'happy' });
  yield hold('drink', 1.6);
  yield set({ item: null, mood: 'calm' });
}

export function* coconutSuccess() {
  yield* shakeTrunk(1.6);
  yield emit('coconut');
  yield set({ mood: 'surprised' });
  yield hold('stand', 0.8);
  yield hold('bend', 0.5);
  yield emit('takeCoconut');
  yield set({ item: 'coconut', mood: 'happy' });
  yield hold('drink', 2);
  yield set({ item: null, mood: 'calm' });
}
