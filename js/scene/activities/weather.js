// Reações ao clima e à maré.

import { hasUpgrade } from '../../core/upgrades.js';
import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* rainShelter(a) {
  const spot = hasUpgrade(a.stars, 'hut') ? SCENE_SPOTS.doorway : SCENE_SPOTS.shade;
  yield set({ mood: 'surprised' });
  yield walk(spot, { run: true });
  yield set({ mood: 'sad', facing: 1 });
  yield hold('shrug', 0.8);
  yield hold('stand', a.between(3, 5));
  yield set({ mood: 'calm' });
}

export function* rainDance() {
  yield walk(SCENE_SPOTS.center);
  yield set({ mood: 'happy', effect: 'notes' });
  yield cycle(['armsUp', 'danceA', 'armsUp', 'danceB'], 1.6, 4.5);
  yield set({ mood: 'calm', effect: null });
}

export function* heatShade(a) {
  yield set({ mood: 'sad', effect: 'sweat' });
  yield walk(SCENE_SPOTS.shade);
  yield set({ facing: 1 });
  yield hold('wipeBrow', 1.2);
  yield set({ mood: 'calm', effect: null });
  yield hold('sit', a.between(3, 5));
}

export function* heatDip() {
  yield set({ mood: 'sad', effect: 'sweat' });
  yield hold('bend', 1.2);
  yield walk(SCENE_SPOTS.shore, { run: true });
  yield walk(SCENE_SPOTS.sea, { run: true });
  yield set({ mood: 'happy', effect: 'splash', facing: 1 });
  yield cycle(['washA', 'washB'], 2.5, 2.4);
  yield set({ effect: null });
  yield walk(SCENE_SPOTS.shore);
  yield set({ mood: 'calm' });
}

export function* collectShells() {
  yield walk(SCENE_SPOTS.shells);
  yield set({ facing: 1, mood: 'focused' });
  for (let shell = 0; shell < 3; shell += 1) {
    yield hold('bend', 0.8);
    yield emit('shell');
    yield hold('stand', 0.5);
    yield walk({ x: SCENE_SPOTS.shells.x + (shell + 1) * 14, y: SCENE_SPOTS.shells.y });
  }
  yield set({ item: 'shell', mood: 'happy' });
  yield hold('showFish', 1.4);
  yield set({ item: null, mood: 'calm' });
}
