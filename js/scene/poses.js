// Poses do náufrago como ângulos de um esqueleto simples. Os ângulos são absolutos:
// 0 aponta para baixo e valores positivos giram para a frente do personagem.

const STAND = {
  hipX: 0,
  hipY: -16,
  lean: 0.02,
  headX: 0,
  headY: 0,
  headRot: 0,
  armF1: 0.12,
  armF2: 0.25,
  armB1: -0.12,
  armB2: -0.02,
  legF1: 0.05,
  legF2: 0.03,
  legB1: -0.05,
  legB2: -0.03,
};

const pose = (changes) => ({ ...STAND, ...changes });
const SIT = { hipX: -3, hipY: -5, lean: -0.1, legF1: 1.35, legF2: 0.75, legB1: 1.15, legB2: 0.55 };
const KNEEL = { hipY: -9, lean: 0.45, legF1: 1.1, legF2: -1.3, legB1: 0.8, legB2: -1.45, headY: 1 };
const LYING = {
  hipX: -2,
  hipY: -4,
  lean: -1.5,
  headRot: -1.5708,
  legF1: 1.5,
  legF2: 1.5,
  legB1: 1.45,
  legB2: 1.5,
};

export const POSES = {
  stand: STAND,
  sit: pose({ ...SIT, armF1: 0.5, armF2: 0.9, armB1: -0.3, armB2: -0.05 }),
  sitFish: pose({ ...SIT, armF1: 1.1, armF2: 1.55, armB1: 0.9, armB2: 1.4 }),
  sitFishTug: pose({ ...SIT, lean: -0.24, armF1: 1.3, armF2: 1.95, armB1: 1.05, armB2: 1.75 }),
  showFish: pose({ lean: -0.05, armF1: 2.3, armF2: 2.9, armB1: -0.3, armB2: -0.1 }),
  hammerUp: pose({ lean: -0.05, armF1: 2.65, armF2: 3, armB1: 0.5, armB2: 0.8, legF1: 0.18, legB1: -0.18 }),
  hammerDown: pose({ lean: 0.3, armF1: 1.3, armF2: 1.25, armB1: 0.6, armB2: 0.9, legF1: 0.18, legB1: -0.18 }),
  wipeBrow: pose({ lean: -0.02, armF1: 1.9, armF2: 3.05, headRot: -0.08 }),
  writeA: pose({ lean: 0.18, armF1: 1.1, armF2: 1.7 }),
  writeB: pose({ lean: 0.2, armF1: 1.3, armF2: 2 }),
  kneel: pose({ ...KNEEL, armF1: 0.8, armF2: 0.8, armB1: 0.6, armB2: 0.6 }),
  kneelPatA: pose({ ...KNEEL, lean: 0.7, armF1: 1.25, armF2: 0.8, armB1: 0.9, armB2: 0.6 }),
  kneelPatB: pose({ ...KNEEL, lean: 0.5, armF1: 1.6, armF2: 1.5, armB1: 1.4, armB2: 1.2 }),
  shakeA: pose({ lean: 0.2, armF1: 1.75, armF2: 2.1, armB1: 1.55, armB2: 2 }),
  shakeB: pose({ lean: 0.05, armF1: 1.45, armF2: 1.85, armB1: 1.3, armB2: 1.7 }),
  drink: pose({ lean: -0.18, headRot: -0.22, armF1: 1.75, armF2: 2.95, armB1: -0.15, armB2: 0 }),
  shadeEyes: pose({ lean: 0.04, armF1: 2.1, armF2: 3, armB1: -0.2, armB2: 0.25 }),
  waveA: pose({ armF1: 2.55, armF2: 2.3, armB1: -0.15 }),
  waveB: pose({ armF1: 2.75, armF2: 3.25, armB1: -0.15 }),
  armsUp: pose({ lean: -0.05, armF1: 2.75, armF2: 3, armB1: -2.75, armB2: -3 }),
  danceA: pose({ hipX: -1, hipY: -15, lean: -0.14, armF1: 2.6, armF2: 2.2, armB1: -1, armB2: -0.4, legF1: 0.4, legF2: 0.05, legB1: -0.12 }),
  danceB: pose({ hipX: 1, hipY: -15, lean: 0.14, armF1: 1, armF2: 0.4, armB1: -2.6, armB2: -2.2, legF1: 0.12, legB1: -0.4, legB2: -0.05 }),
  sleepA: pose({ ...LYING, armF1: 0.9, armF2: 1.4, armB1: 1.1, armB2: 1.5 }),
  sleepB: pose({ ...LYING, lean: -1.46, armF1: 0.95, armF2: 1.42, armB1: 1.1, armB2: 1.5 }),
  sadA: pose({ ...SIT, lean: 0.42, headY: 2, headRot: 0.16, legF1: 1.95, legF2: 0.15, legB1: 1.8, legB2: 0.05, armF1: 1.25, armF2: 2.3, armB1: 1.05, armB2: 2.1 }),
  sadB: pose({ ...SIT, lean: 0.5, headY: 3, headRot: 0.24, legF1: 1.95, legF2: 0.15, legB1: 1.8, legB2: 0.05, armF1: 1.3, armF2: 2.35, armB1: 1.1, armB2: 2.15 }),
  stargaze: pose({ ...SIT, lean: -0.5, headRot: -0.28, armF1: -0.65, armF2: -0.2, armB1: -0.85, armB2: -0.35 }),
  warmA: pose({ ...SIT, lean: 0.06, armF1: 1.3, armF2: 1.5, armB1: 1.15, armB2: 1.4 }),
  warmB: pose({ ...SIT, lean: 0.1, armF1: 1.38, armF2: 1.62, armB1: 1.22, armB2: 1.5 }),
  bend: pose({ hipX: -1, hipY: -14, lean: 1.05, headY: 1, armF1: 0.55, armF2: 0.4, armB1: 0.35, armB2: 0.25, legF1: 0.14, legB1: -0.1 }),
  read: pose({ lean: 0.02, headRot: 0.14, armF1: 0.95, armF2: 2.05, armB1: 0.8, armB2: 1.95 }),
  sitFishNod: pose({ ...SIT, lean: 0.1, headY: 2, headRot: 0.2, armF1: 1, armF2: 1.3, armB1: 0.8, armB2: 1.2 }),
  fallBack: pose({ hipX: -4, hipY: -4, lean: -1.2, headRot: -0.9, legF1: 2.3, legF2: 1.9, legB1: 2, legB2: 1.6, armF1: -1.8, armF2: -1.3, armB1: -2.3, armB2: -1.8 }),
  dazedA: pose({ ...SIT, lean: -0.2, headX: -1, headRot: -0.18, armF1: 0.3, armF2: 0.5, armB1: -0.4, armB2: -0.2 }),
  dazedB: pose({ ...SIT, lean: -0.05, headX: 1, headRot: 0.18, armF1: 0.5, armF2: 0.7, armB1: -0.3, armB2: -0.1 }),
  lookUp: pose({ lean: -0.1, headRot: -0.28, armF1: 0.2, armF2: 0.4, armB1: -0.2, armB2: 0 }),
  scratchHead: pose({ lean: 0.02, headRot: 0.08, armF1: 2.2, armF2: 3.15, armB1: -0.1, armB2: 0.1 }),
  yawn: pose({ lean: -0.12, headRot: -0.2, armF1: 2.4, armF2: 3, armB1: -2.4, armB2: -3 }),
  kickA: pose({ lean: -0.08, legF1: 1, legF2: 0.75, armF1: -0.35, armF2: -0.1, armB1: 0.3, armB2: 0.5 }),
  kickB: pose({ lean: 0.04, legF1: 0.12, legF2: 0.05, armF1: 0.2, armF2: 0.35, armB1: -0.2, armB2: -0.05 }),
  jumpCrouch: pose({ hipY: -12, lean: 0.25, legF1: 0.85, legF2: -0.55, legB1: 0.6, legB2: -0.75, armF1: -0.5, armF2: -0.2, armB1: -0.7, armB2: -0.4 }),
  jumpUp: pose({ hipY: -24, lean: -0.05, legF1: 0.15, legF2: -0.25, legB1: -0.1, legB2: -0.45, armF1: 2.8, armF2: 3.05, armB1: 2.6, armB2: 2.95 }),
  throwBack: pose({ lean: -0.3, armF1: -2.3, armF2: -2.7, armB1: 0.7, armB2: 1, legF1: 0.3, legB1: -0.25 }),
  throwForward: pose({ lean: 0.2, armF1: 2.4, armF2: 2.7, armB1: -0.5, armB2: -0.3, legF1: 0.3, legB1: -0.25 }),
  climbA: pose({ hipY: -18, lean: 0.25, armF1: 2.5, armF2: 2.9, armB1: 1.8, armB2: 2.2, legF1: 1.3, legF2: 0.1, legB1: 0.5, legB2: 0.2 }),
  climbB: pose({ hipY: -18, lean: 0.25, armF1: 1.8, armF2: 2.2, armB1: 2.5, armB2: 2.9, legF1: 0.5, legF2: 0.2, legB1: 1.3, legB2: 0.1 }),
  hopA: pose({ hipY: -20, lean: 0.08, armF1: 1.2, armF2: 2.3, armB1: 1, armB2: 2.2, legF1: 0.9, legF2: 0.2, legB1: 0, legB2: -0.1 }),
  hopB: pose({ hipY: -16, lean: 0.14, armF1: 1.3, armF2: 2.4, armB1: 1.1, armB2: 2.3, legF1: 1, legF2: 0.1, legB1: 0, legB2: 0 }),
  fistA: pose({ lean: -0.06, armF1: 2.5, armF2: 3, armB1: 0.5, armB2: 1 }),
  fistB: pose({ lean: -0.02, armF1: 2.15, armF2: 2.4, armB1: 0.5, armB2: 1 }),
  washA: pose({ hipY: -15, lean: 0.12, armF1: 1.6, armF2: 2.2, armB1: -1.6, armB2: -2.2 }),
  washB: pose({ hipY: -15, lean: -0.1, armF1: 1.1, armF2: 1.4, armB1: -1.1, armB2: -1.4 }),
  sunbathe: pose({ ...LYING, armF1: -2.4, armF2: 0.9, armB1: -2.6, armB2: 0.8, legF1: 1.1, legF2: 1.85 }),
  cookA: pose({ ...SIT, lean: 0.1, armF1: 1.35, armF2: 1.5, armB1: 0.6, armB2: 0.9 }),
  cookB: pose({ ...SIT, lean: 0.14, armF1: 1.45, armF2: 1.62, armB1: 0.6, armB2: 0.9 }),
  eat: pose({ lean: -0.04, armF1: 1.6, armF2: 2.85, armB1: -0.15, armB2: 0 }),
  sawA: pose({ lean: 0.34, armF1: 0.9, armF2: 1.2, armB1: 0.6, armB2: 0.9, legF1: 0.2, legB1: -0.2 }),
  sawB: pose({ lean: 0.22, armF1: 1.3, armF2: 1.7, armB1: 0.6, armB2: 0.9, legF1: 0.2, legB1: -0.2 }),
  readSit: pose({ ...SIT, lean: -0.05, headRot: 0.14, armF1: 0.9, armF2: 1.9, armB1: 0.7, armB2: 1.75 }),
  readPage: pose({ ...SIT, lean: -0.02, headRot: 0.1, armF1: 1, armF2: 2.15, armB1: 0.7, armB2: 1.75 }),
  dive: pose({ hipY: -14, lean: 1.3, headRot: 0.5, armF1: 1.9, armF2: 1.8, armB1: 1.7, armB2: 1.7, legF1: -1.2, legF2: -1.25, legB1: -1.1, legB2: -1.15 }),
  bellyFlop: pose({ hipY: -13, lean: 1.5, headRot: 0.2, armF1: 0.4, armF2: 2.6, armB1: -0.4, armB2: -2.6, legF1: -1.5, legF2: -0.8, legB1: -1.4, legB2: -2.1 }),
  swimA: pose({ hipY: -13, lean: 0.5, armF1: 2.1, armF2: 1.7, armB1: -0.6, armB2: 0.1 }),
  swimB: pose({ hipY: -13, lean: 0.45, armF1: -0.6, armF2: 0.1, armB1: 2.1, armB2: 1.7 }),
  rubA: pose({ ...KNEEL, lean: 0.55, armF1: 1.2, armF2: 1.1, armB1: 1, armB2: 0.7 }),
  rubB: pose({ ...KNEEL, lean: 0.5, armF1: 1, armF2: 0.7, armB1: 1.2, armB2: 1.1 }),
  spyglass: pose({ lean: 0.03, armF1: 1.4, armF2: 2.1, armB1: 1.1, armB2: 2 }),
  hips: pose({ lean: -0.04, armF1: 0.95, armF2: -0.75, armB1: -0.95, armB2: 0.75, legF1: 0.14, legB1: -0.14 }),
  whistle: pose({ lean: -0.05, headRot: -0.1, armF1: -0.5, armF2: 0.5, armB1: -0.5, armB2: 0.5 }),
  checkWrist: pose({ lean: 0.08, headRot: 0.2, armF1: 1.1, armF2: 1.9, armB1: 0.8, armB2: 1.5 }),
  swatA: pose({ lean: 0.04, armF1: 2.3, armF2: 2.9, armB1: -0.15, armB2: 0 }),
  swatB: pose({ lean: 0.1, armF1: 1.5, armF2: 1.2, armB1: -0.15, armB2: 0 }),
  tapA: pose({ legF1: 0.3, legF2: 0.65, armF1: 0.95, armF2: -0.75, armB1: 0.15, armB2: 0.3 }),
  tapB: pose({ legF1: 0.15, legF2: 0.1, armF1: 0.95, armF2: -0.75, armB1: 0.15, armB2: 0.3 }),
  backStretch: pose({ lean: -0.36, headRot: -0.2, armF1: -1, armF2: 0.7, armB1: -1, armB2: 0.7 }),
  facepalm: pose({ lean: 0.14, headRot: 0.22, headY: 1, armF1: 1.35, armF2: 2.95, armB1: -0.12, armB2: 0 }),
  sniff: pose({ lean: -0.14, headRot: -0.22, armF1: 0.25, armF2: 0.4, armB1: -0.15, armB2: 0 }),
  shrug: pose({ lean: -0.02, armF1: 1.05, armF2: 2.55, armB1: -1.05, armB2: -2.55 }),
  sneezeA: pose({ lean: -0.22, headRot: -0.28, armF1: 0.3, armF2: 0.5, armB1: -0.3, armB2: -0.1 }),
  sneezeB: pose({ lean: 0.5, headRot: 0.3, headY: 2, armF1: 0.6, armF2: 0.9, armB1: 0.4, armB2: 0.7 }),
};

export function blendPose(current, target, amount) {
  const next = {};
  for (const key of Object.keys(target)) {
    next[key] = current[key] + (target[key] - current[key]) * amount;
  }
  return next;
}

// Pernas e braços opostos, com um pequeno balanço do corpo.
export function walkPose(phase, running = false) {
  const stride = running ? 0.85 : 0.55;
  const swing = Math.sin(phase);
  const knee = Math.max(0, Math.cos(phase)) * (running ? 0.95 : 0.5);
  const otherKnee = Math.max(0, -Math.cos(phase)) * (running ? 0.95 : 0.5);
  const elbow = running ? 1 : 0.3;
  return {
    ...STAND,
    hipY: -16 + Math.abs(Math.cos(phase)) * (running ? 1.8 : 0.8),
    lean: running ? 0.26 : 0.09,
    armF1: -swing * stride,
    armF2: -swing * stride + elbow,
    armB1: swing * stride,
    armB2: swing * stride + elbow,
    legF1: swing * stride + knee * 0.3,
    legF2: swing * stride - knee,
    legB1: -swing * stride + otherKnee * 0.3,
    legB2: -swing * stride - otherKnee,
  };
}
