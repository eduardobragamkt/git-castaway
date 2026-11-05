import assert from 'node:assert/strict';
import test from 'node:test';
import { devOptions, profileUrl } from '../js/data.js';
import { ACTIVITIES, SCENE_SPOTS, collectBottle, celebrateCrate, pickActivity } from '../js/scene/activities.js';
import { Actor } from '../js/scene/actor.js';
import { POSES, blendPose, walkPose } from '../js/scene/poses.js';
import { celestialBody, isNight, normalizeHour, paletteAt } from '../js/time.js';
import { STAR_UPGRADES, hasUpgrade, nextUpgrade } from '../js/upgrades.js';
import { cameraAfterZoom, clampScale, clampSceneCamera, fitScale, scaleLimits, stepScale, zoomPercent } from '../js/zoom.js';

const ENERGIES = ['dormindo', 'pescando', 'trabalhando'];

function fixedRandom() {
  let state = 7;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

test('o botão do pop-up aponta para o perfil público, não para o repositório', () => {
  assert.equal(profileUrl('maria-dev'), 'https://github.com/maria-dev');
  assert.equal(profileUrl('eduardobragamkt'), 'https://github.com/eduardobragamkt');
  assert.equal(profileUrl('../evil'), null);
  assert.equal(profileUrl('a/b'), null);
  assert.equal(profileUrl(''), null);
  assert.equal(profileUrl(null), null);
});

test('opções de teste não existem em produção', () => {
  const search = '?hora=21&cena=fish&visao=cena';
  assert.deepEqual(devOptions({ hostname: 'eduardobragamkt.github.io', search }), {});
  assert.equal(devOptions({ hostname: 'localhost', search }).hour, 21);
  assert.equal(devOptions({ hostname: 'localhost', search: '' }).hour, null);
});

test('a paleta existe em toda hora e escurece à noite', () => {
  for (let hour = 0; hour < 24; hour += 0.25) {
    const palette = paletteAt(hour);
    for (const color of [...palette.sky, ...palette.sea, palette.ambient]) {
      assert.match(color, /^#[0-9a-f]{6}$/, `hora ${hour}: ${color}`);
    }
  }
  assert.equal(paletteAt(12).ambient, '#ffffff');
  assert.equal(paletteAt(12).night, 0);
  assert.equal(paletteAt(23).night, 1);
  assert.equal(paletteAt(24).night, 1);
  assert.equal(normalizeHour(-1), 23);
});

test('sempre há exatamente um astro no céu', () => {
  assert.equal(celestialBody(12).kind, 'sun');
  assert.equal(celestialBody(23).kind, 'moon');
  assert.equal(celestialBody(2).kind, 'moon');
  for (let hour = 0; hour < 24; hour += 0.25) {
    const { t } = celestialBody(hour);
    assert.ok(t >= 0 && t <= 1, `hora ${hour}: t=${t}`);
  }
  assert.equal(isNight(12), false);
  assert.equal(isNight(22), true);
});

test('o náufrago sem commits só dorme, fica triste ou se espreguiça', () => {
  const allowed = new Set(['sleep', 'sad', 'stretch', 'horizon']);
  const random = fixedRandom();
  for (let i = 0; i < 400; i += 1) {
    const name = pickActivity({ energy: 'dormindo', commits: 0, stars: 500, night: i % 2 === 0 }, null, random);
    assert.ok(allowed.has(name), name);
  }
});

test('a energia muda a atividade mais frequente', () => {
  const count = (energy) => {
    const tally = {};
    const random = fixedRandom();
    for (let i = 0; i < 2000; i += 1) {
      const name = pickActivity({ energy, commits: 3, stars: 0, night: false }, null, random);
      tally[name] = (tally[name] ?? 0) + 1;
    }
    return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
  };
  assert.equal(count('pescando'), 'fish');
  assert.equal(count('trabalhando'), 'hammer');
});

test('a mesma atividade não se repete em seguida', () => {
  const random = fixedRandom();
  let last = null;
  for (let i = 0; i < 300; i += 1) {
    const name = pickActivity({ energy: 'pescando', commits: 2, stars: 10, night: false }, last, random);
    assert.notEqual(name, last);
    last = name;
  }
});

test('atividades com pré-requisito respeitam estrelas e hora', () => {
  assert.equal(ACTIVITIES.warmHands.weight({ stars: 0, night: true }), 0);
  assert.ok(ACTIVITIES.warmHands.weight({ stars: 5, night: true }) > 0);
  assert.equal(ACTIVITIES.warmHands.weight({ stars: 5, night: false }), 0);
  assert.equal(ACTIVITIES.stargaze.weight({ energy: 'pescando', night: false }), 0);
});

function runScript(actor, seconds) {
  const events = [];
  actor.onEvent = (event) => events.push(event);
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) actor.update(0.05);
  return events;
}

test('cada atividade termina e usa apenas poses existentes', () => {
  for (const name of Object.keys(ACTIVITIES)) {
    const actor = new Actor({ energy: 'pescando', fixedActivity: name, commits: 3, stars: 100, random: fixedRandom() });
    runScript(actor, 90);
    assert.ok(Number.isFinite(actor.x) && Number.isFinite(actor.y), name);
    for (const value of Object.values(actor.pose)) assert.ok(Number.isFinite(value), name);
  }
});

test('todas as poses têm os mesmos campos', () => {
  const keys = Object.keys(POSES.stand).sort();
  for (const [name, pose] of Object.entries(POSES)) {
    assert.deepEqual(Object.keys(pose).sort(), keys, name);
  }
  assert.deepEqual(Object.keys(walkPose(1)).sort(), keys);
  assert.deepEqual(blendPose(POSES.stand, POSES.sit, 1), POSES.sit);
});

test('o sorteio não trava em horas longas com qualquer energia', () => {
  for (const energy of ENERGIES) {
    for (const night of [false, true]) {
      const actor = new Actor({ energy, commits: 3, stars: 100, night: () => night, random: fixedRandom() });
      runScript(actor, 600);
      assert.equal(actor.pose.hipY < 0, true);
    }
  }
});

test('a garrafa interrompe a rotina e entrega o balão na ordem certa', () => {
  const order = [];
  const actor = new Actor({ energy: 'dormindo', random: fixedRandom() });
  runScript(actor, 3);
  actor.onEvent = (event) => event();
  actor.interrupt(
    collectBottle(
      () => order.push('pegou'),
      () => order.push('abriu'),
      () => order.push('fechou'),
    ),
  );
  for (let elapsed = 0; elapsed < 30 && order.length < 3; elapsed += 0.05) actor.update(0.05);
  assert.deepEqual(order, ['pegou', 'abriu', 'fechou']);
});

test('a caixa de suprimentos leva o náufrago até ela', () => {
  const actor = new Actor({ energy: 'pescando', random: fixedRandom() });
  actor.interrupt(celebrateCrate());
  for (let elapsed = 0; elapsed < 4; elapsed += 0.05) actor.update(0.05);
  assert.deepEqual({ x: actor.x, y: actor.y }, SCENE_SPOTS.crate);
});

test('próxima melhoria segue a ordem de estrelas', () => {
  assert.equal(nextUpgrade(0).sprite, 'caixote');
  assert.equal(nextUpgrade(4).sprite, 'fogueira');
  assert.equal(nextUpgrade(100), null);
  assert.equal(hasUpgrade(5, 'fogueira'), true);
  assert.equal(hasUpgrade(4, 'fogueira'), false);
  const thresholds = STAR_UPGRADES.map((upgrade) => upgrade.stars);
  assert.deepEqual(thresholds, [...thresholds].sort((a, b) => a - b));
});

test('a escala do zoom é sempre inteira e fica dentro dos limites', () => {
  for (const view of ['map', 'scene']) {
    for (const [width, height, dpr] of [[1920, 1080, 1], [375, 812, 2], [795, 846, 1], [320, 480, 1], [2560, 1440, 2]]) {
      const fit = fitScale(view, width, height, dpr);
      const limits = scaleLimits(fit);
      assert.ok(Number.isInteger(fit) && fit >= 1);
      assert.ok(limits.min <= fit && fit <= limits.max);
      let scale = fit;
      for (let i = 0; i < 40; i += 1) scale = stepScale(scale, 1, limits);
      assert.equal(scale, limits.max);
      for (let i = 0; i < 40; i += 1) scale = stepScale(scale, -1, limits);
      assert.equal(scale, limits.min);
    }
  }
  assert.equal(clampScale(2.4, { min: 1, max: 6 }), 2);
  assert.equal(zoomPercent(6, 4), 150);
});

test('a cena inteira cabe na tela no zoom de ajuste', () => {
  for (const [width, height, dpr] of [[1920, 1080, 1], [375, 812, 2], [795, 846, 1], [1366, 768, 1]]) {
    const fit = fitScale('scene', width, height, dpr);
    assert.ok((width * dpr) / fit >= 345, `${width}x${height}`);
  }
});

test('o ponto sob o cursor fica parado durante o zoom', () => {
  const size = { width: 1000, height: 800 };
  const camera = { x: 40, y: -20 };
  const pointer = { x: 900, y: 100 };
  const worldAt = (cam, scale) => ({
    x: cam.x + (pointer.x - size.width / 2) / scale,
    y: cam.y + (pointer.y - size.height / 2) / scale,
  });
  const next = cameraAfterZoom(camera, pointer, size, 2, 5);
  const before = worldAt(camera, 2);
  const after = worldAt(next, 5);
  assert.ok(Math.abs(before.x - after.x) < 1e-9);
  assert.ok(Math.abs(before.y - after.y) < 1e-9);
});

test('sem zoom, a cena fica centralizada e não arrasta', () => {
  const centered = clampSceneCamera({ x: 500, y: -300 }, 480, 270);
  assert.ok(centered.x === 0 && centered.y === 0);
  const zoomed = clampSceneCamera({ x: 500, y: -300 }, 200, 120);
  assert.equal(zoomed.x, 95);
  assert.equal(zoomed.y, -70);
});
