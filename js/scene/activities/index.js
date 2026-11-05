// Catálogo do que o náufrago faz na cena. Cada atividade tem versões curtas, escritas como
// roteiros em geradores, e o sorteador escolhe conforme energia, hora, estrelas e clima.

import { hasUpgrade } from '../../core/upgrades.js';
import { fishSmall, fishBoot, fishTumble, fishBait, fishNap, fishGull, fishSpit, fishFin } from './fishing.js';
import { coconutShake, coconutJump, coconutStone, coconutClimb, coconutOnHead, coconutSuccess } from './coconut.js';
import { hammerSteady, hammerThumb, benchSaw, benchPlank, benchCollapse, benchMeasure, benchPaint, commitBoard } from './bench.js';
import { castleProud, castleWave, stroll, sunbathe, bathe, jog } from './beach.js';
import { stretch, dance, sleep, sad, stargaze } from './moods.js';
import { crabWake, crabPinch, poolSquirt, bugsInvasion, mergeConflict } from './critters.js';
import { readCalm, readNap, readGullPerch, readGullBath, readGullStays } from './reading.js';
import { diveClean, diveBellyFlop } from './dive.js';
import { fireFails, fireBurnsHand, fireLights, warmHands, cookFish } from './fire.js';
import { helpSand, helpBottle, helpWave } from './help.js';
import { horizon, spyNothing, spyWhale, spyWrongEnd } from './lookout.js';
import { rainShelter, rainDance, heatShade, heatDip, collectShells } from './weather.js';
import { visitorPlane, visitorBalloon, visitorDolphins, visitorTurtle, visitorWhale, visitorFlock } from './visitors.js';
import { walkTiptoe, walkTrip, walkWhistle, gagSlip, gagSneeze } from './walks.js';
import { bottleFromSea } from './bottle.js';
import { gardenWater, gardenTend, raftBuild, raftCollapse, raftTest } from './projects.js';

export { SCENE_SPOTS } from './steps.js';
export * from './fishing.js';
export * from './coconut.js';
export * from './bench.js';
export * from './beach.js';
export * from './moods.js';
export * from './critters.js';
export * from './reading.js';
export * from './dive.js';
export * from './fire.js';
export * from './help.js';
export * from './lookout.js';
export * from './weather.js';
export * from './visitors.js';
export * from './walks.js';
export * from './bottle.js';
export * from './projects.js';
export * from './pauses.js';
export * from './celebrations.js';

const ACTIVITY_SHARE_CAP = 0.25;
const SHARE_WARMUP_SECONDS = 60;

const only = (run) => ({ main: run });
const hasFire = (stars) => hasUpgrade(stars, 'campfire');

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
      spit: fishSpit,
      fin: fishFin,
    },
    weight: ({ energy, night }) => {
      if (energy === 'sleeping') return 0;
      if (night) return 3;
      return energy === 'fishing' ? 6 : 4;
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
      if (energy === 'sleeping') return 0;
      return night ? 3 : 5;
    },
  },
  hammer: {
    variants: {
      steady: hammerSteady,
      thumb: hammerThumb,
      saw: benchSaw,
      plank: benchPlank,
      collapse: benchCollapse,
      measure: benchMeasure,
      paint: benchPaint,
    },
    weight: ({ energy }) => ({ working: 3, fishing: 1 })[energy] ?? 0,
  },
  read: {
    variants: {
      calm: readCalm,
      nap: readNap,
      gullPerch: readGullPerch,
      gullBath: readGullBath,
      gullStays: readGullStays,
    },
    weight: ({ energy, rain }) => (energy === 'sleeping' || rain ? 0 : 3),
  },
  dive: {
    variants: { clean: diveClean, bellyFlop: diveBellyFlop },
    weight: ({ energy, night, rain }) => (energy === 'sleeping' || night || rain ? 0 : 3),
  },
  makeFire: {
    variants: { fails: fireFails, burnsHand: fireBurnsHand, lights: fireLights },
    weight: ({ energy, rain }) => (energy === 'sleeping' || rain ? 0 : 3),
  },
  askHelp: {
    variants: { sand: helpSand, bottle: helpBottle, wave: helpWave },
    weight: ({ energy, night }) => (energy === 'sleeping' || night ? 0 : 2),
  },
  spyglass: {
    variants: { nothing: spyNothing, whale: spyWhale, wrongEnd: spyWrongEnd },
    weight: ({ energy, night }) => (energy === 'sleeping' || night ? 0 : 2),
  },
  bugs: {
    variants: only(bugsInvasion),
    weight: ({ energy, commits }) => (energy === 'sleeping' ? 0 : commits >= 5 ? 3 : 2),
  },
  mergeConflict: {
    variants: only(mergeConflict),
    weight: ({ energy, night }) => (energy === 'sleeping' || night ? 0 : 2),
  },
  tidePool: {
    variants: only(poolSquirt),
    weight: ({ energy, night }) => (energy === 'sleeping' || night ? 0 : 1),
  },
  bottle: {
    variants: only(bottleFromSea),
    weight: ({ energy, rain }) => (rain ? 0 : energy === 'sleeping' ? 1 : 3),
  },
  garden: {
    variants: { water: gardenWater, tend: gardenTend },
    weight: ({ energy, night, rain }) => (energy === 'sleeping' || night || rain ? 0 : 3),
  },
  raftWork: {
    variants: { build: raftBuild, collapse: raftCollapse, test: raftTest },
    weight: ({ energy, night, rain }) => (energy === 'sleeping' || night || rain ? 0 : 3),
  },
  shelter: { variants: only(rainShelter), weight: ({ rain }) => (rain ? 6 : 0) },
  rainDance: {
    variants: only(rainDance),
    weight: ({ energy, rain }) => (rain && energy !== 'sleeping' ? 4 : 0),
  },
  beatTheHeat: {
    variants: { shade: heatShade, dip: heatDip },
    weight: ({ hot }) => (hot ? 5 : 0),
  },
  collectShells: {
    variants: only(collectShells),
    weight: ({ energy, night, lowTide }) => (lowTide && !night && energy !== 'sleeping' ? 4 : 0),
  },
  visitor: {
    variants: {
      plane: visitorPlane,
      balloon: visitorBalloon,
      dolphins: visitorDolphins,
      turtle: visitorTurtle,
      whale: visitorWhale,
      flock: visitorFlock,
    },
    weight: ({ energy, night }) => (energy === 'sleeping' || night ? 0 : 3),
  },
  walkabout: {
    variants: { tiptoe: walkTiptoe, trip: walkTrip, whistle: walkWhistle },
    weight: ({ energy }) => (energy === 'sleeping' ? 0 : 2),
  },
  gag: {
    variants: { slip: gagSlip, sneeze: gagSneeze },
    weight: ({ energy }) => (energy === 'sleeping' ? 0 : 2),
  },
  commitBoard: {
    variants: only(commitBoard),
    weight: ({ energy, commits }) => (energy !== 'sleeping' && commits > 0 ? 2 : 0),
  },
  sandcastle: {
    variants: { proud: castleProud, wave: castleWave },
    weight: ({ energy, night }) => (energy !== 'sleeping' && !night ? 3 : 0),
  },
  crabPinch: {
    variants: only(crabPinch),
    weight: ({ energy, night }) => (energy !== 'sleeping' && !night ? 2 : 0),
  },
  bathe: {
    variants: only(bathe),
    weight: ({ energy, night }) => (energy !== 'sleeping' && !night ? 2 : 0),
  },
  jog: {
    variants: only(jog),
    weight: ({ energy, night }) => (energy !== 'sleeping' && !night ? 2 : 0),
  },
  sunbathe: {
    variants: only(sunbathe),
    weight: ({ energy, night }) => (energy !== 'sleeping' && !night ? 2 : 0),
  },
  cookFish: {
    variants: only(cookFish),
    weight: ({ energy, stars }) => (energy !== 'sleeping' && hasFire(stars) ? 2 : 0),
  },
  stroll: { variants: only(stroll), weight: ({ energy }) => (energy === 'sleeping' ? 0 : 2) },
  horizon: {
    variants: only(horizon),
    weight: ({ energy, night }) => (night ? 0 : energy === 'sleeping' ? 1 : 2),
  },
  stretch: { variants: only(stretch), weight: () => 1 },
  dance: { variants: only(dance), weight: ({ energy }) => (energy === 'working' ? 2 : 0) },
  sleep: { variants: only(sleep), weight: ({ energy, night }) => (energy === 'sleeping' ? 6 : night ? 2 : 0) },
  sad: { variants: only(sad), weight: ({ energy }) => (energy === 'sleeping' ? 4 : 0) },
  crabWake: { variants: only(crabWake), weight: ({ energy }) => (energy === 'sleeping' ? 1 : 0) },
  stargaze: {
    variants: only(stargaze),
    weight: ({ energy, night }) => (night && energy !== 'sleeping' ? 3 : 0),
  },
  warmHands: {
    variants: only(warmHands),
    weight: ({ energy, stars, night }) => (night && energy !== 'sleeping' && hasFire(stars) ? 3 : 0),
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

  if (context.energy !== 'sleeping') {
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
