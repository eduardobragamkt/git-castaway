// Segunda leva de roteiros do náufrago. Todos são originais do Git Castaway: leitura,
// mergulho, fogo, pedidos de ajuda, visitantes, clima, piadas e o humor do Git.

import { hasUpgrade } from '../upgrades.js';
import { SCENE_SPOTS, biteAlert, castLine, cycle, dazed, emit, hold, leap, set, walk } from './script.js';

// Pesca

export function* fishSpit(a) {
  yield* castLine(a, 3, 6);
  yield* biteAlert();
  yield emit('spit');
  yield set({ item: null, mood: 'surprised', effect: 'sweat' });
  yield hold('sitFishTug', 1);
  yield hold('wipeBrow', 1.4);
  yield set({ mood: 'calm', effect: null });
}

export function* fishFin(a) {
  yield* castLine(a, 3, 5);
  yield emit('fin');
  yield hold('sitFish', 1.6);
  yield set({ item: null, mood: 'surprised' });
  yield hold('jumpUp', 0.4);
  yield walk(SCENE_SPOTS.horizon, { run: true });
  yield set({ facing: 1, effect: 'sweat' });
  yield hold('shadeEyes', 1.6);
  yield set({ mood: 'calm', effect: null });
}

// Bancada

function* atBench(item) {
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

// Leitura

function* openBook() {
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

// Mergulho

function* climbForDive() {
  yield walk(SCENE_SPOTS.trunk);
  yield set({ facing: -1, mood: 'focused' });
  yield cycle(['climbA', 'climbB'], 2.4, 2.2, { lift: 20 });
  yield set({ mood: 'happy' });
  yield hold('climbA', 0.5);
}

function* swimBack(a) {
  yield emit('splash');
  yield set({ lift: 0, effect: 'splash', facing: 1 });
  yield cycle(['swimA', 'swimB'], 2.2, a.between(1.5, 2.5));
  yield set({ effect: null });
  yield walk(SCENE_SPOTS.beachLeft);
}

export function* diveClean(a) {
  yield* climbForDive();
  yield leap(SCENE_SPOTS.seaLeft, 30, 1.1, 'dive');
  yield* swimBack(a);
  yield set({ mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield set({ mood: 'calm' });
}

export function* diveBellyFlop(a) {
  yield* climbForDive();
  yield leap(SCENE_SPOTS.seaLeft, 26, 1, 'bellyFlop');
  yield set({ mood: 'dizzy' });
  yield* swimBack(a);
  yield* dazed(a);
}

// Fogo

function* rubSticks(seconds) {
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

// Pedidos de ajuda: nunca funcionam, e essa é a graça.

export function* helpSand() {
  yield walk(SCENE_SPOTS.sos);
  yield set({ facing: 1, mood: 'focused' });
  for (let letter = 0; letter < 3; letter += 1) {
    yield cycle(['kneelPatA', 'kneelPatB'], 1.8, 1.1);
    yield emit('sosLetter');
  }
  yield set({ mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield emit('sosWave');
  yield set({ mood: 'surprised' });
  yield hold('stand', 0.9);
  yield set({ mood: 'sad' });
  yield hold('facepalm', 1.1);
  yield set({ mood: 'calm' });
}

export function* helpBottle() {
  yield walk(SCENE_SPOTS.throwing);
  yield set({ facing: -1, item: 'paper', mood: 'focused' });
  yield hold('read', 1.8);
  yield hold('throwBack', 0.4);
  yield set({ item: null });
  yield emit('throwBottle');
  yield hold('throwForward', 0.5);
  yield set({ mood: 'calm' });
  yield hold('shadeEyes', 2);
}

export function* helpWave() {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, mood: 'focused' });
  yield cycle(['waveA', 'waveB'], 3, 2.6);
  yield set({ mood: 'sad' });
  yield hold('shrug', 1.2);
  yield set({ mood: 'calm' });
}

// Luneta

function* lookThrough(seconds) {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, item: 'spyglass', mood: 'focused' });
  yield hold('spyglass', seconds);
}

export function* spyNothing() {
  yield* lookThrough(3);
  yield set({ item: null, mood: 'sad' });
  yield hold('shrug', 1);
  yield set({ mood: 'calm' });
}

export function* spyWhale() {
  yield* lookThrough(1);
  yield emit('visitor:baleia');
  yield hold('spyglass', 3.4);
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 0.9);
  yield set({ mood: 'calm' });
}

export function* spyWrongEnd() {
  yield walk(SCENE_SPOTS.horizon);
  yield set({ facing: 1, item: 'spyglassBackwards', mood: 'surprised' });
  yield hold('spyglass', 1.8);
  yield set({ item: null, mood: 'focused' });
  yield hold('scratchHead', 1);
  yield* lookThrough(1.6);
  yield set({ item: null, mood: 'calm' });
}

// O humor do Git

export function* bugsInvasion() {
  yield walk(SCENE_SPOTS.bugs);
  yield emit('bugsSpawn');
  yield set({ mood: 'surprised', facing: 1 });
  yield hold('stand', 0.9);
  yield set({ item: 'hammer', mood: 'focused' });
  for (let swing = 0; swing < 4; swing += 1) {
    yield cycle(['hammerUp', 'hammerDown'], 2.4, 0.85);
    yield emit('bugSquash');
  }
  yield emit('bugsFlee');
  yield set({ item: null, mood: 'happy' });
  yield hold('armsUp', 1);
  yield set({ mood: 'calm' });
}

export function* mergeConflict() {
  yield walk(SCENE_SPOTS.conflict);
  yield emit('conflictStart');
  yield set({ facing: 1, mood: 'surprised' });
  yield hold('stand', 1.6);
  yield set({ mood: 'focused' });
  yield hold('scratchHead', 1.4);
  yield cycle(['waveA', 'waveB'], 2.5, 1.6);
  yield emit('conflictEnd');
  yield set({ mood: 'happy' });
  yield hold('shrug', 1.1);
  yield set({ mood: 'calm' });
}

export function* poolSquirt() {
  yield walk(SCENE_SPOTS.pool);
  yield set({ facing: 1, mood: 'focused' });
  yield hold('bend', 1.4);
  yield emit('squirt');
  yield hold('bend', 0.4);
  yield set({ mood: 'surprised', effect: 'ink' });
  yield cycle(['hopA', 'hopB'], 3, 1.3);
  yield set({ mood: 'sad' });
  yield hold('wipeBrow', 1.2);
  yield set({ mood: 'calm', effect: null });
}

// Clima e maré

export function* rainShelter(a) {
  const spot = hasUpgrade(a.stars, 'cabana') ? SCENE_SPOTS.doorway : SCENE_SPOTS.shade;
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

// Visitantes: passam, às vezes interagem, e nunca o levam embora.

export function* visitorPlane() {
  yield walk(SCENE_SPOTS.horizon);
  yield emit('visitor:aviao');
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
  yield emit('visitor:balao');
  yield set({ facing: -1, mood: 'surprised' });
  yield hold('lookUp', 4);
  yield set({ mood: 'happy' });
  yield hold('armsUp', 1.1);
  yield set({ mood: 'calm' });
}

export function* visitorDolphins() {
  yield walk(SCENE_SPOTS.bottle);
  yield emit('visitor:golfinhos');
  yield set({ facing: -1, mood: 'happy' });
  yield hold('shadeEyes', 2.6);
  yield hold('armsUp', 1.2);
  yield set({ mood: 'calm' });
}

export function* visitorTurtle() {
  yield walk(SCENE_SPOTS.turtle);
  yield emit('visitor:tartaruga');
  yield set({ facing: 1, mood: 'surprised' });
  yield hold('stand', 2.4);
  yield set({ mood: 'happy' });
  yield hold('kneel', 2.2);
  yield hold('stand', 0.6);
  yield set({ mood: 'calm' });
}

export function* visitorWhale() {
  yield walk(SCENE_SPOTS.horizon);
  yield emit('visitor:baleia');
  yield set({ facing: 1, mood: 'surprised' });
  yield hold('shadeEyes', 2.8);
  yield set({ mood: 'happy' });
  yield cycle(['waveA', 'waveB'], 2.5, 1.2);
  yield set({ mood: 'calm' });
}

export function* visitorFlock() {
  yield walk(SCENE_SPOTS.stroll);
  yield emit('visitor:revoada');
  yield set({ facing: 1, mood: 'calm' });
  yield hold('lookUp', 3.4);
  yield hold('stand', 0.5);
}

// Passeios e piadas curtas

export function* walkTiptoe() {
  yield walk(SCENE_SPOTS.beachRight);
  yield set({ mood: 'surprised', effect: 'sweat', facing: -1 });
  yield cycle(['hopA', 'hopB'], 4, 1.5);
  yield walk(SCENE_SPOTS.stroll, { run: true });
  yield set({ mood: 'calm', effect: null });
  yield hold('stand', 0.4);
}

export function* walkTrip(a) {
  yield walk(SCENE_SPOTS.beachLeft);
  yield set({ mood: 'surprised' });
  yield hold('fallBack', 0.8);
  yield* dazed(a);
}

export function* walkWhistle() {
  yield set({ mood: 'happy', effect: 'notes' });
  yield walk(SCENE_SPOTS.beachRight);
  yield hold('whistle', 1.4);
  yield walk(SCENE_SPOTS.stroll);
  yield set({ mood: 'calm', effect: null });
}

export function* gagSlip(a) {
  yield walk(SCENE_SPOTS.castle);
  yield emit('banana');
  yield walk(SCENE_SPOTS.bottle);
  yield set({ mood: 'surprised' });
  yield hold('fallBack', 0.7);
  yield* dazed(a);
}

export function* gagSneeze() {
  yield walk(SCENE_SPOTS.stroll);
  yield set({ mood: 'focused' });
  yield hold('sniff', 1);
  yield hold('sniff', 0.8);
  yield set({ mood: 'surprised', effect: 'dust' });
  yield cycle(['sneezeA', 'sneezeB'], 3, 1);
  yield set({ mood: 'calm', effect: null });
  yield hold('shrug', 0.8);
}

// As 14 pausas curtas entre as ações.

export function* beatScratch() {
  yield set({ mood: 'calm' });
  yield hold('scratchHead', 1.6);
  yield hold('stand', 0.5);
}

export function* beatLookAround(a) {
  yield set({ mood: 'calm', facing: -a.facing });
  yield hold('stand', 1);
  yield set({ facing: -a.facing });
  yield hold('stand', 1);
}

export function* beatYawn() {
  yield set({ mood: 'sleepy' });
  yield hold('yawn', 1.8);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.5);
}

export function* beatKick() {
  yield set({ mood: 'calm' });
  yield cycle(['kickA', 'kickB'], 1.5, 2);
  yield hold('stand', 0.3);
}

export function* beatSigh() {
  yield set({ mood: 'sad' });
  yield hold('bend', 1.6);
  yield hold('stand', 1);
}

export function* beatHips() {
  yield set({ mood: 'calm' });
  yield hold('hips', 2.2);
}

export function* beatWhistle() {
  yield set({ mood: 'happy', effect: 'notes' });
  yield hold('whistle', 2.4);
  yield set({ mood: 'calm', effect: null });
}

export function* beatWrist() {
  yield set({ mood: 'focused' });
  yield hold('checkWrist', 1.5);
  yield set({ mood: 'sad' });
  yield hold('shrug', 0.9);
  yield set({ mood: 'calm' });
}

export function* beatSwat() {
  yield set({ mood: 'focused' });
  yield cycle(['swatA', 'swatB'], 2.8, 1.8);
  yield set({ mood: 'calm' });
}

export function* beatTap() {
  yield set({ mood: 'calm' });
  yield cycle(['tapA', 'tapB'], 2.5, 2);
}

export function* beatBack() {
  yield set({ mood: 'sad' });
  yield hold('backStretch', 1.7);
  yield set({ mood: 'calm' });
  yield hold('stand', 0.4);
}

export function* beatFacepalm() {
  yield set({ mood: 'sad' });
  yield hold('facepalm', 1.6);
  yield set({ mood: 'calm' });
}

export function* beatSniff() {
  yield set({ mood: 'focused' });
  yield hold('sniff', 1.6);
  yield set({ mood: 'calm' });
}

export function* beatShrug() {
  yield set({ mood: 'calm' });
  yield hold('shrug', 1.5);
}

export const PAUSE_BEATS = [
  beatScratch,
  beatLookAround,
  beatYawn,
  beatKick,
  beatSigh,
  beatHips,
  beatWhistle,
  beatWrist,
  beatSwat,
  beatTap,
  beatBack,
  beatFacepalm,
  beatSniff,
  beatShrug,
];

export const SLEEPY_BEATS = [beatYawn, beatSigh, beatBack, beatFacepalm];

// Comemoração de um marco real do repositório.
export function* celebrateMilestone(onStart, onEnd) {
  yield set({ item: null, effect: null, mood: 'surprised', lift: 0 });
  yield walk(SCENE_SPOTS.center);
  yield set({ facing: 1, mood: 'happy', effect: 'notes' });
  yield emit('confetti');
  yield emit(onStart);
  yield cycle(['armsUp', 'danceA', 'armsUp', 'danceB'], 1.6, 5.5);
  yield emit(onEnd);
  yield set({ mood: 'calm', effect: null });
  yield hold('stand', 0.5);
}
