// Vocabulário dos roteiros: lugares da ilha, passos e trechos reaproveitados.

export const SCENE_SPOTS = {
  center: { x: 8, y: 42 },
  shore: { x: 124, y: 46 },
  bench: { x: -38, y: 45 },
  board: { x: -4, y: 36 },
  castle: { x: 38, y: 50 },
  palm: { x: -108, y: 40 },
  trunk: { x: -90, y: 25 },
  fire: { x: -40, y: 51 },
  rest: { x: 24, y: 47 },
  horizon: { x: 112, y: 40 },
  bottle: { x: 116, y: 52 },
  crate: { x: 54, y: 42 },
  sun: { x: 50, y: 47 },
  sea: { x: 166, y: 56 },
  seaLeft: { x: -172, y: 60 },
  beachLeft: { x: -124, y: 49 },
  beachRight: { x: 122, y: 50 },
  stroll: { x: -8, y: 47 },
  reading: { x: -112, y: 45 },
  pool: { x: 72, y: 47 },
  sos: { x: -6, y: 52 },
  throwing: { x: -136, y: 51 },
  doorway: { x: 34, y: 34 },
  shade: { x: -112, y: 42 },
  conflict: { x: -6, y: 47 },
  bugs: { x: -20, y: 50 },
  turtle: { x: 52, y: 50 },
  shells: { x: 44, y: 53 },
};

export const walk = (spot, extra = {}) => ({ walk: spot, ...extra });
export const hold = (pose, seconds = 0.5, extra = {}) => ({ pose, seconds, ...extra });
export const cycle = (poses, hz, seconds, extra = {}) => ({ cycle: poses, hz, seconds, ...extra });
export const set = (props) => ({ set: props });
export const emit = (event) => ({ emit: event });
export const leap = (to, height, seconds, pose) => ({ leap: { to, height }, seconds, pose });

export function* dazed(a) {
  yield set({ item: null, mood: 'dizzy', effect: 'stars', lift: 0 });
  yield cycle(['dazedA', 'dazedB'], 1.4, a.between(1.8, 2.8));
  yield set({ effect: null, mood: 'sad' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}

export function* castLine(a, minSeconds, maxSeconds) {
  yield walk(SCENE_SPOTS.shore);
  yield set({ facing: 1, item: 'rod', mood: 'calm' });
  yield hold('sitFish', 0.7);
  yield cycle(['sitFish', 'sitFishTug'], 0.55, a.between(minSeconds, maxSeconds));
}

export function* biteAlert() {
  yield set({ mood: 'surprised' });
  yield cycle(['sitFish', 'sitFishTug'], 4, 0.8);
}
