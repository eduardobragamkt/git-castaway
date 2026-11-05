// O que o náufrago faz na cena. Cada atividade tem versões curtas, escritas como roteiros
// em geradores, e o ator executa um passo por vez. Os roteiros são originais do Git Castaway.

import { hasUpgrade } from '../upgrades.js';
import * as more from './more-activities.js';
import { SCENE_SPOTS, biteAlert, castLine, cycle, dazed, emit, hold, set, walk } from './script.js';

export { SCENE_SPOTS } from './script.js';
export { celebrateMilestone, introBottle } from './more-activities.js';

const ACTIVITY_SHARE_CAP = 0.25;
const SHARE_WARMUP_SECONDS = 60;

function* shakeTrunk(seconds) {
  yield walk(SCENE_SPOTS.palm);
  yield set({ facing: 1, mood: 'focused' });
  yield cycle(['shakeA', 'shakeB'], 3.5, seconds);
}

// Pesca

function* fishSmall(a) {
  yield* castLine(a, 5, 9);
  yield* biteAlert();
  yield set({ item: 'fish', mood: 'happy' });
  yield hold('showFish', 2);
  yield set({ item: null, mood: 'calm' });
}

function* fishBoot(a) {
  yield* castLine(a, 4, 7);
  yield* biteAlert();
  yield set({ item: 'boot', mood: 'surprised' });
  yield hold('showFish', 1.4);
  yield set({ mood: 'sad' });
  yield hold('showFish', 1.2);
  yield set({ item: null, mood: 'calm' });
}

function* fishTumble(a) {
  yield* castLine(a, 3, 6);
  yield* biteAlert();
  yield cycle(['sitFishTug', 'sitFish'], 6, 0.9);
  yield set({ item: null });
  yield hold('fallBack', 0.9);
  yield* dazed(a);
}

function* fishBait(a) {
  yield* castLine(a, 4, 7);
  yield* biteAlert();
  yield set({ item: 'hook', mood: 'sad' });
  yield hold('showFish', 1.8);
  yield hold('scratchHead', 1);
  yield set({ item: null, mood: 'calm' });
}

function* fishNap(a) {
  yield* castLine(a, 2, 3);
  yield set({ mood: 'asleep', effect: 'zzz' });
  yield cycle(['sitFish', 'sitFishNod'], 0.5, a.between(5, 8));
  yield set({ effect: null, mood: 'surprised' });
  yield hold('sitFish', 0.8);
  yield set({ item: null, mood: 'calm' });
}

function* fishGull(a) {
  yield* castLine(a, 4, 7);
  yield* biteAlert();
  yield set({ item: 'fish', mood: 'happy' });
  yield emit('gull');
  yield hold('showFish', 1.3);
  yield set({ item: null, mood: 'surprised' });
  yield emit('gullFlee');
  yield hold('showFish', 0.7);
  yield set({ mood: 'sad', effect: 'angry' });
  yield cycle(['fistA', 'fistB'], 3, 1.8);
  yield set({ mood: 'calm', effect: null });
}

// Coco

function* coconutShake() {
  yield* shakeTrunk(2.4);
  yield set({ mood: 'sad', effect: 'sweat' });
  yield hold('lookUp', 1.2);
  yield hold('scratchHead', 1);
  yield set({ mood: 'calm', effect: null });
}

function* coconutJump() {
  yield walk(SCENE_SPOTS.palm);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('lookUp', 0.7);
  yield cycle(['jumpCrouch', 'jumpUp'], 2.6, 2.8);
  yield set({ mood: 'sad', effect: 'sweat' });
  yield hold('bend', 1.1);
  yield set({ mood: 'calm', effect: null });
}

function* coconutStone(a) {
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

function* coconutClimb(a) {
  yield walk(SCENE_SPOTS.trunk);
  yield set({ facing: -1, mood: 'focused' });
  yield cycle(['climbA', 'climbB'], 2.4, 2.4, { lift: 20 });
  yield set({ mood: 'surprised' });
  yield hold('climbA', 0.5);
  yield hold('climbB', 0.35, { lift: 0 });
  yield* dazed(a);
}

function* coconutOnHead(a) {
  yield* shakeTrunk(1.3);
  yield hold('lookUp', 0.3);
  yield emit('coconutHead');
  yield hold('lookUp', 0.5);
  yield* dazed(a);
  yield set({ item: 'coconut', mood: 'happy' });
  yield hold('drink', 1.6);
  yield set({ item: null, mood: 'calm' });
}

function* coconutSuccess() {
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

// Bancada

function* hammerSteady(a) {
  yield walk(SCENE_SPOTS.bench);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(3, 5));
  yield set({ item: null, mood: 'calm', effect: 'sweat' });
  yield hold('wipeBrow', 1.2);
  yield set({ mood: 'happy', effect: null });
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

function* hammerThumb(a) {
  yield walk(SCENE_SPOTS.bench);
  yield set({ facing: -1, item: 'hammer', mood: 'focused' });
  yield cycle(['hammerUp', 'hammerDown'], 2.2, a.between(2, 3.5));
  yield set({ item: null, mood: 'surprised', effect: 'stars' });
  yield cycle(['hopA', 'hopB'], 3.5, 2);
  yield set({ mood: 'sad', effect: null });
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

// Outras atividades

function* commitBoard(a) {
  yield walk(SCENE_SPOTS.board);
  yield set({ facing: -1, item: 'stick', mood: 'focused' });
  yield cycle(['writeA', 'writeB'], 2, a.between(2.5, 4));
  yield emit('commit');
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 1);
  yield set({ mood: 'calm' });
}

function* buildCastle(a) {
  yield walk(SCENE_SPOTS.castle);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('kneel', 0.5);
  yield cycle(['kneelPatA', 'kneelPatB'], 1.8, a.between(3, 5));
  yield emit('castle');
}

function* castleProud(a) {
  yield* buildCastle(a);
  yield set({ mood: 'happy' });
  yield hold('sit', 1.5);
  yield set({ mood: 'calm' });
}

function* castleWave(a) {
  yield* buildCastle(a);
  yield set({ mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield emit('waveWipe');
  yield set({ mood: 'surprised' });
  yield hold('stand', 1);
  yield set({ mood: 'sad' });
  yield hold('sit', 1.6);
  yield set({ mood: 'calm' });
}

function* horizon(a) {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('shadeEyes', a.between(2, 3.5));
  yield cycle(['waveA', 'waveB'], 2.5, 1.4);
  yield hold('stand', 0.4);
}

function* stretch() {
  yield set({ mood: 'sleepy' });
  yield hold('armsUp', 1.1);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

function* dance(a) {
  yield walk(SCENE_SPOTS.center);
  yield set({ mood: 'happy', effect: 'notes' });
  yield cycle(['danceA', 'danceB'], 2.4, a.between(3, 5));
  yield set({ mood: 'calm', effect: null });
}

function* sleep(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'sleepy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'asleep', effect: 'zzz' });
  yield cycle(['sleepA', 'sleepB'], 0.3, a.between(8, 14));
  yield set({ mood: 'sleepy', effect: null });
  yield hold('sit', 0.8);
}

function* sad(a) {
  yield walk(SCENE_SPOTS.castle);
  yield set({ facing: 1, mood: 'sad' });
  yield cycle(['sadA', 'sadB'], 0.35, a.between(5, 9));
  yield set({ mood: 'calm' });
}

function* crabWake(a) {
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

function* crabPinch() {
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

function* bathe(a) {
  yield walk(SCENE_SPOTS.shore);
  yield walk(SCENE_SPOTS.sea);
  yield set({ facing: 1, mood: 'happy', effect: 'splash' });
  yield cycle(['washA', 'washB'], 2.5, a.between(3, 5));
  yield set({ effect: null });
  yield hold('armsUp', 0.7);
  yield walk(SCENE_SPOTS.shore);
  yield hold('wipeBrow', 0.8);
  yield set({ mood: 'calm' });
}

function* jog(a) {
  const [first, second] = a.random() > 0.5
    ? [SCENE_SPOTS.beachLeft, SCENE_SPOTS.beachRight]
    : [SCENE_SPOTS.beachRight, SCENE_SPOTS.beachLeft];
  yield set({ mood: 'focused' });
  yield walk(first, { run: true });
  yield walk(second, { run: true });
  yield set({ mood: 'happy', effect: 'sweat' });
  yield hold('bend', 1.3);
  yield hold('wipeBrow', 0.8);
  yield set({ mood: 'calm', effect: null });
}

function* sunbathe(a) {
  yield walk(SCENE_SPOTS.sun);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('sit', 0.5);
  yield set({ mood: 'asleep' });
  yield hold('sunbathe', a.between(5, 9));
  yield set({ mood: 'happy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}

function* cookFish(a) {
  yield walk(SCENE_SPOTS.fire);
  yield set({ facing: 1, item: 'cooking', mood: 'focused' });
  yield cycle(['cookA', 'cookB'], 0.8, a.between(4, 7));
  yield set({ mood: 'happy', item: 'cooked' });
  yield hold('eat', 1.8);
  yield set({ item: null, mood: 'calm' });
}

function* stroll(a) {
  yield walk(SCENE_SPOTS.stroll);
  yield set({ mood: 'calm', facing: a.random() > 0.5 ? 1 : -1 });
  yield hold('stand', 0.8);
  yield hold('lookUp', a.between(1, 2));
  yield walk(SCENE_SPOTS.beachRight);
  yield hold('shadeEyes', 1);
}

function* stargaze(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('stargaze', a.between(5, 8));
  yield emit('shootingStar');
  yield set({ mood: 'surprised' });
  yield hold('stargaze', 1.6);
  yield set({ mood: 'happy' });
  yield hold('sit', 0.6);
  yield set({ mood: 'calm' });
}

function* warmHands(a) {
  yield walk(SCENE_SPOTS.fire);
  yield set({ facing: 1, mood: 'calm' });
  yield cycle(['warmA', 'warmB'], 0.5, a.between(5, 8));
}

// Pausas curtas entre as ações: é o que tira o jeito de robô.
export function pauseBeat(actor) {
  const beats = actor.energy === 'dormindo' ? more.SLEEPY_BEATS : more.PAUSE_BEATS;
  return beats[Math.floor(actor.random() * beats.length)](actor);
}

export function* openingScript() {
  yield set({ mood: 'sleepy' });
  yield hold('yawn', 2);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

export function* closingScript(a) {
  yield walk(SCENE_SPOTS.rest);
  yield set({ facing: 1, mood: 'calm' });
  yield hold('sit', a.between(3, 6));
  yield hold('stand', 0.5);
}

const only = (run) => ({ main: run });
const hasFire = (stars) => hasUpgrade(stars, 'fogueira');

// weight devolve 0 quando a atividade não cabe no momento.
export const ACTIVITIES = {
  fish: {
    variants: {
      small: fishSmall,
      boot: fishBoot,
      tumble: fishTumble,
      bait: fishBait,
      nap: fishNap,
      gull: fishGull,
      spit: more.fishSpit,
      fin: more.fishFin,
    },
    weight: ({ energy, night }) => {
      if (energy === 'dormindo') return 0;
      if (night) return 3;
      return energy === 'pescando' ? 6 : 4;
    },
  },
  coconut: {
    variants: {
      shake: coconutShake,
      jump: coconutJump,
      stone: coconutStone,
      climb: coconutClimb,
      head: coconutOnHead,
      success: coconutSuccess,
    },
    weight: ({ energy, night }) => {
      if (energy === 'dormindo') return 0;
      return night ? 3 : 5;
    },
  },
  hammer: {
    variants: {
      steady: hammerSteady,
      thumb: hammerThumb,
      saw: more.benchSaw,
      plank: more.benchPlank,
      collapse: more.benchCollapse,
      measure: more.benchMeasure,
      paint: more.benchPaint,
    },
    weight: ({ energy }) => ({ trabalhando: 3, pescando: 1 })[energy] ?? 0,
  },
  read: {
    variants: {
      calm: more.readCalm,
      nap: more.readNap,
      gullPerch: more.readGullPerch,
      gullBath: more.readGullBath,
      gullStays: more.readGullStays,
    },
    weight: ({ energy, rain }) => (energy === 'dormindo' || rain ? 0 : 3),
  },
  dive: {
    variants: { clean: more.diveClean, bellyFlop: more.diveBellyFlop },
    weight: ({ energy, night, rain }) => (energy === 'dormindo' || night || rain ? 0 : 3),
  },
  makeFire: {
    variants: { fails: more.fireFails, burnsHand: more.fireBurnsHand, lights: more.fireLights },
    weight: ({ energy, rain }) => (energy === 'dormindo' || rain ? 0 : 3),
  },
  askHelp: {
    variants: { sand: more.helpSand, bottle: more.helpBottle, wave: more.helpWave },
    weight: ({ energy, night }) => (energy === 'dormindo' || night ? 0 : 2),
  },
  spyglass: {
    variants: { nothing: more.spyNothing, whale: more.spyWhale, wrongEnd: more.spyWrongEnd },
    weight: ({ energy, night }) => (energy === 'dormindo' || night ? 0 : 2),
  },
  bugs: {
    variants: only(more.bugsInvasion),
    weight: ({ energy, commits }) => (energy === 'dormindo' ? 0 : commits >= 5 ? 3 : 2),
  },
  mergeConflict: {
    variants: only(more.mergeConflict),
    weight: ({ energy, night }) => (energy === 'dormindo' || night ? 0 : 2),
  },
  tidePool: {
    variants: only(more.poolSquirt),
    weight: ({ energy, night }) => (energy === 'dormindo' || night ? 0 : 1),
  },
  bottle: {
    variants: only(more.bottleFromSea),
    weight: ({ energy, rain }) => (rain ? 0 : energy === 'dormindo' ? 1 : 3),
  },
  garden: {
    variants: { water: more.gardenWater, tend: more.gardenTend },
    weight: ({ energy, night, rain }) => (energy === 'dormindo' || night || rain ? 0 : 3),
  },
  raftWork: {
    variants: { build: more.raftBuild, collapse: more.raftCollapse, test: more.raftTest },
    weight: ({ energy, night, rain }) => (energy === 'dormindo' || night || rain ? 0 : 3),
  },
  shelter: { variants: only(more.rainShelter), weight: ({ rain }) => (rain ? 6 : 0) },
  rainDance: {
    variants: only(more.rainDance),
    weight: ({ energy, rain }) => (rain && energy !== 'dormindo' ? 4 : 0),
  },
  beatTheHeat: {
    variants: { shade: more.heatShade, dip: more.heatDip },
    weight: ({ hot }) => (hot ? 5 : 0),
  },
  collectShells: {
    variants: only(more.collectShells),
    weight: ({ energy, night, lowTide }) => (lowTide && !night && energy !== 'dormindo' ? 4 : 0),
  },
  visitor: {
    variants: {
      plane: more.visitorPlane,
      balloon: more.visitorBalloon,
      dolphins: more.visitorDolphins,
      turtle: more.visitorTurtle,
      whale: more.visitorWhale,
      flock: more.visitorFlock,
    },
    weight: ({ energy, night }) => (energy === 'dormindo' || night ? 0 : 3),
  },
  walkabout: {
    variants: { tiptoe: more.walkTiptoe, trip: more.walkTrip, whistle: more.walkWhistle },
    weight: ({ energy }) => (energy === 'dormindo' ? 0 : 2),
  },
  gag: {
    variants: { slip: more.gagSlip, sneeze: more.gagSneeze },
    weight: ({ energy }) => (energy === 'dormindo' ? 0 : 2),
  },
  commitBoard: {
    variants: only(commitBoard),
    weight: ({ energy, commits }) => (energy !== 'dormindo' && commits > 0 ? 2 : 0),
  },
  sandcastle: {
    variants: { proud: castleProud, wave: castleWave },
    weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 3 : 0),
  },
  crabPinch: {
    variants: only(crabPinch),
    weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 2 : 0),
  },
  bathe: {
    variants: only(bathe),
    weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 2 : 0),
  },
  jog: {
    variants: only(jog),
    weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 2 : 0),
  },
  sunbathe: {
    variants: only(sunbathe),
    weight: ({ energy, night }) => (energy !== 'dormindo' && !night ? 2 : 0),
  },
  cookFish: {
    variants: only(cookFish),
    weight: ({ energy, stars }) => (energy !== 'dormindo' && hasFire(stars) ? 2 : 0),
  },
  stroll: { variants: only(stroll), weight: ({ energy }) => (energy === 'dormindo' ? 0 : 2) },
  horizon: {
    variants: only(horizon),
    weight: ({ energy, night }) => (night ? 0 : energy === 'dormindo' ? 1 : 2),
  },
  stretch: { variants: only(stretch), weight: () => 1 },
  dance: { variants: only(dance), weight: ({ energy }) => (energy === 'trabalhando' ? 2 : 0) },
  sleep: { variants: only(sleep), weight: ({ energy, night }) => (energy === 'dormindo' ? 6 : night ? 2 : 0) },
  sad: { variants: only(sad), weight: ({ energy }) => (energy === 'dormindo' ? 4 : 0) },
  crabWake: { variants: only(crabWake), weight: ({ energy }) => (energy === 'dormindo' ? 1 : 0) },
  stargaze: {
    variants: only(stargaze),
    weight: ({ energy, night }) => (night && energy !== 'dormindo' ? 3 : 0),
  },
  warmHands: {
    variants: only(warmHands),
    weight: ({ energy, stars, night }) => (night && energy !== 'dormindo' && hasFire(stars) ? 3 : 0),
  },
};

// Sorteio ponderado que evita repetir as últimas atividades e deixa de fora quem já
// ocupou mais de 25% do tempo. Sem commits, as opções são poucas por regra, então o
// limite de tempo não se aplica.
export function pickActivity(context, recent = [], random = Math.random, shares = {}) {
  const available = Object.keys(ACTIVITIES)
    .map((name) => [name, ACTIVITIES[name].weight(context)])
    .filter(([, weight]) => weight > 0);

  const window = Math.max(1, Math.min(3, available.length - 3));
  const blocked = recent.slice(-window);
  const fresh = available.filter(([name]) => !blocked.includes(name));
  let pool = fresh.length > 0 ? fresh : available;

  if (context.energy !== 'dormindo') {
    const underCap = pool.filter(([name]) => (shares[name] ?? 0) < ACTIVITY_SHARE_CAP);
    if (underCap.length > 0) pool = underCap;
  }

  let roll = random() * pool.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [name, weight] of pool) {
    roll -= weight;
    if (roll < 0) return name;
  }
  return pool[pool.length - 1][0];
}

// Sorteia uma versão diferente da última vista naquela atividade.
export function pickVariant(activity, lastVariant, random = Math.random) {
  const names = Object.keys(ACTIVITIES[activity].variants);
  const options = names.length > 1 ? names.filter((name) => name !== lastVariant) : names;
  return options[Math.floor(random() * options.length)];
}

export function activityShares(timeSpent) {
  const total = Object.values(timeSpent).reduce((sum, seconds) => sum + seconds, 0);
  if (total < SHARE_WARMUP_SECONDS) return {};
  return Object.fromEntries(Object.entries(timeSpent).map(([name, seconds]) => [name, seconds / total]));
}

// Trajetos longos passam pela faixa livre da praia, em vez de cortar os objetos.
export function routeTo(from, to) {
  const dx = to.x - from.x;
  const laneY = 49;
  if (Math.abs(dx) <= 30 || (from.y >= 47 && to.y >= 47)) return [to];
  const direction = Math.sign(dx);
  return [
    { x: from.x + direction * 8, y: laneY },
    { x: to.x - direction * 8, y: laneY },
    to,
  ];
}

export function* celebrateCrate() {
  yield set({ item: null, effect: null, mood: 'surprised', lift: 0 });
  yield hold('stand', 1.4);
  yield walk(SCENE_SPOTS.crate);
  yield set({ facing: 1, mood: 'happy' });
  yield cycle(['armsUp', 'stand'], 2, 2);
  yield set({ mood: 'calm' });
}
