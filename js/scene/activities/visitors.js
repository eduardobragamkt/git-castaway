// Visitantes: passam, às vezes interagem, e nunca o levam embora.

import { SCENE_SPOTS, cycle, emit, hold, set, walk } from './steps.js';

export function* visitorPlane() {
  yield walk(SCENE_SPOTS.horizon);
  yield emit('visitor:plane');
  yield set({ facing: -1, mood: 'surprised' });
  yield hold('lookUp', 1);
  yield set({ mood: 'happy' });
  yield cycle(['waveA', 'waveB'], 3, 2.6);
  yield set({ mood: 'sad' });
  yield hold('shrug', 1);
  yield set({ mood: 'calm' });
}

export function* visitorBalloon() {
  yield walk(SCENE_SPOTS.center);
  yield emit('visitor:balloon');
  yield set({ facing: -1, mood: 'surprised' });
  yield hold('lookUp', 4);
  yield set({ mood: 'happy' });
  yield hold('armsUp', 1.1);
  yield set({ mood: 'calm' });
}

export function* visitorDolphins() {
  yield walk(SCENE_SPOTS.bottle);
  yield emit('visitor:dolphins');
  yield set({ facing: -1, mood: 'happy' });
  yield hold('shadeEyes', 2.6);
  yield hold('armsUp', 1.2);
  yield set({ mood: 'calm' });
}

export function* visitorTurtle() {
  yield walk(SCENE_SPOTS.turtle);
  yield emit('visitor:turtle');
  yield set({ facing: 1, mood: 'surprised' });
  yield hold('stand', 2.4);
  yield set({ mood: 'happy' });
  yield hold('kneel', 2.2);
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

export function* visitorWhale() {
  yield walk(SCENE_SPOTS.horizon);
  yield emit('visitor:whale');
  yield set({ facing: 1, mood: 'surprised' });
  yield hold('shadeEyes', 2.8);
  yield set({ mood: 'happy' });
  yield cycle(['waveA', 'waveB'], 2.5, 1.2);
  yield set({ mood: 'calm' });
}

export function* visitorFlock() {
  yield walk(SCENE_SPOTS.stroll);
  yield emit('visitor:flock');
  yield set({ facing: 1, mood: 'calm' });
  yield hold('lookUp', 3.4);
  yield hold('stand', 0.5);
}
