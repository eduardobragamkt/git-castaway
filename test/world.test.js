import assert from 'node:assert/strict';
import test from 'node:test';
import {
  daysOnIsland,
  easterSunday,
  holidayOn,
  isAnniversary,
  isLowTide,
  pendingMilestones,
  tideLevel,
  weatherAt,
} from '../js/core/calendar.js';
import { ACTIVITIES, pickActivity } from '../js/scene/activities/index.js';
import { Actor } from '../js/scene/actor.js';
import { PAUSE_BEATS, SLEEPY_BEATS, diveClean } from '../js/scene/activities/index.js';
import { RAFT_STAGES, gardenBlooms, gardenStage, raftStage } from '../js/scene/progress.js';

function fixedRandom() {
  let state = 7;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

const day = (month, date, year = 2027) => new Date(year, month - 1, date, 12);

test('a Páscoa e o Carnaval caem nas datas certas', () => {
  assert.equal(easterSunday(2026).getMonth(), 3);
  assert.equal(easterSunday(2026).getDate(), 5);
  assert.equal(easterSunday(2027).getMonth(), 2);
  assert.equal(easterSunday(2027).getDate(), 28);
  assert.equal(holidayOn(day(2, 9, 2027)), 'carnival');
  assert.equal(holidayOn(day(2, 6, 2027)), 'carnival');
  assert.equal(holidayOn(day(2, 5, 2027)), null);
  assert.equal(holidayOn(day(2, 10, 2027)), null);
});

test('cada data comemorativa aparece no período certo', () => {
  assert.equal(holidayOn(day(12, 24)), 'christmas');
  assert.equal(holidayOn(day(12, 26)), null);
  assert.equal(holidayOn(day(12, 31)), 'newYear');
  assert.equal(holidayOn(day(1, 1)), 'newYear');
  assert.equal(holidayOn(day(10, 31)), 'halloween');
  assert.equal(holidayOn(day(3, 16)), 'stPatricks');
  assert.equal(holidayOn(day(6, 24)), 'juneFestival');
  assert.equal(holidayOn(day(7, 4)), 'independenceDay');
  assert.equal(holidayOn(day(5, 10)), null);
});

test('o clima é igual para todos na mesma hora e muda com o tempo', () => {
  const date = new Date('2026-11-05T12:30:00Z');
  assert.equal(weatherAt(42, date), weatherAt(42, new Date('2026-11-05T12:59:00Z')));
  const seen = new Set();
  for (let hour = 0; hour < 24 * 30; hour += 1) {
    seen.add(weatherAt(42, new Date(date.getTime() + hour * 3600 * 1000)));
  }
  assert.deepEqual([...seen].sort(), ['clear', 'heat', 'rain']);
});

test('a maré sobe e desce ao longo do dia', () => {
  let low = 0;
  let high = 0;
  for (let hour = 0; hour < 25; hour += 0.25) {
    const date = new Date(Date.UTC(2026, 10, 5, 0) + hour * 3600 * 1000);
    const level = tideLevel(date);
    assert.ok(level >= 0 && level <= 1);
    if (isLowTide(date)) low += 1;
    else high += 1;
  }
  assert.ok(low > 0 && high > 0);
});

test('os dias na ilha começam em 1 e sobem com o tempo', () => {
  const start = '2026-11-01T10:00:00Z';
  assert.equal(daysOnIsland(start, new Date('2026-11-01T12:00:00Z')), 1);
  assert.equal(daysOnIsland(start, new Date('2026-11-11T12:00:00Z')), 11);
  assert.equal(daysOnIsland(null), null);
});

test('marcos vêm de dados reais e não se repetem', () => {
  const island = { isMain: true, stars: 12, commits3d: 11, createdAt: '2026-11-01T10:00:00Z' };
  const context = { forks: 1 };
  const now = new Date('2026-12-01T12:00:00Z');
  const first = pendingMilestones(island, context, [], now);
  assert.deepEqual(first, ['primeiraEstrela', 'dezEstrelas', 'primeiroFork', 'dezCommits']);
  assert.deepEqual(pendingMilestones(island, context, first, now), []);
  assert.deepEqual(pendingMilestones({ stars: 0, commits3d: 0 }, context, [], now), []);
});

test('fork sem configuração também tem marcos próprios, sem depender de token', () => {
  const fork = { isMain: false, stars: 1, commits3d: 0, createdAt: '2026-11-01T10:00:00Z' };
  assert.deepEqual(pendingMilestones(fork, { forks: 9 }, [], new Date('2026-12-01T12:00:00Z')), [
    'primeiraEstrela',
  ]);
});

test('aniversário só vale a partir do ano seguinte, uma vez por ano', () => {
  const created = '2026-11-05T12:00:00Z';
  assert.equal(isAnniversary(created, new Date('2026-11-05T15:00:00Z')), false);
  assert.equal(isAnniversary(created, new Date('2027-11-05T15:00:00Z')), true);
  const island = { stars: 0, commits3d: 0, createdAt: created };
  const now = new Date('2027-11-05T15:00:00Z');
  assert.deepEqual(pendingMilestones(island, {}, [], now), ['aniversario2027']);
  assert.deepEqual(pendingMilestones(island, {}, ['aniversario2027'], now), []);
});

test('cada grupo pedido tem a quantidade de versões próprias combinada', () => {
  const count = (name) => Object.keys(ACTIVITIES[name].variants).length;
  assert.equal(count('fish'), 8);
  assert.equal(count('hammer'), 7);
  assert.equal(count('read'), 5);
  assert.equal(count('dive'), 2);
  assert.equal(count('visitor'), 6);
  assert.equal(count('walkabout'), 3);
  assert.equal(count('gag'), 2);
  assert.equal(PAUSE_BEATS.length, 14);
  assert.ok(SLEEPY_BEATS.every((beat) => PAUSE_BEATS.includes(beat)));
});

test('barco e canoa não existem nas atividades', () => {
  const vessel = /boat|ship|canoe|canoa|barco|navio/i;
  for (const [name, activity] of Object.entries(ACTIVITIES)) {
    assert.doesNotMatch(name, vessel);
    for (const variant of Object.keys(activity.variants)) assert.doesNotMatch(variant, vessel);
  }
});

test('nenhuma cena termina com ele fora da ilha', () => {
  for (const [name, activity] of Object.entries(ACTIVITIES)) {
    for (const [variant, script] of Object.entries(activity.variants)) {
      const actor = new Actor({ energy: 'fishing', commits: 4, stars: 120, random: fixedRandom() });
      actor.interrupt(script(actor));
      let elapsed = 0;
      while (actor.current === 'interrupt' && elapsed < 120) {
        actor.update(0.05);
        elapsed += 0.05;
      }
      assert.ok(elapsed < 120, `${name}/${variant} não terminou`);
      assert.ok(Math.abs(actor.x) <= 152, `${name}/${variant} terminou em x=${actor.x}`);
      assert.equal(actor.lift, 0, `${name}/${variant} terminou no ar`);
    }
  }
});

test('a jangada sempre afunda e o deixa de volta na praia', () => {
  const events = [];
  const actor = new Actor({ energy: 'fishing', fixedActivity: 'raftWork', fixedVariant: 'test', random: fixedRandom() });
  actor.onEvent = (event) => events.push(event);
  let reachedSea = false;
  for (let t = 0; t < 12; t += 0.05) {
    actor.update(0.05);
    if (actor.x < -154) reachedSea = true;
  }
  assert.ok(reachedSea);
  assert.ok(events.indexOf('raftLaunch') < events.indexOf('raftSink'));
  assert.ok(events.includes('raftSink'));
  assert.ok(Math.abs(actor.x) <= 152);
});

test('a jangada cresce em etapas e recomeça sem nunca terminar', () => {
  assert.equal(raftStage(1), 0);
  assert.equal(raftStage(4), 1);
  assert.equal(raftStage(13), RAFT_STAGES - 1);
  assert.equal(raftStage(16), 0);
  assert.equal(raftStage(null), 0);
  for (let days = 1; days < 500; days += 1) {
    assert.ok(raftStage(days) >= 0 && raftStage(days) < RAFT_STAGES);
  }
});

test('o jardim cresce com os dias e floresce com commits', () => {
  assert.deepEqual([1, 3, 7, 14, 30, 60, 400].map(gardenStage), [1, 2, 3, 4, 5, 6, 6]);
  assert.equal(gardenStage(null), 1);
  assert.equal(gardenBlooms(0), false);
  assert.equal(gardenBlooms(2), true);
});

test('todas as pausas terminam e o náufrago volta à rotina', () => {
  for (const beat of PAUSE_BEATS) {
    const actor = new Actor({ energy: 'fishing', random: fixedRandom() });
    actor.interrupt(beat(actor));
    for (let t = 0; t < 8; t += 0.05) actor.update(0.05);
    assert.notEqual(actor.current, 'interrupt', beat.name);
  }
});

test('chuva, calor e maré baixa mudam o que ele pode fazer', () => {
  const base = { energy: 'fishing', commits: 2, stars: 0, night: false };
  assert.equal(ACTIVITIES.shelter.weight(base), 0);
  assert.ok(ACTIVITIES.shelter.weight({ ...base, rain: true }) > 0);
  assert.equal(ACTIVITIES.dive.weight({ ...base, rain: true }), 0);
  assert.equal(ACTIVITIES.makeFire.weight({ ...base, rain: true }), 0);
  assert.ok(ACTIVITIES.beatTheHeat.weight({ ...base, hot: true }) > 0);
  assert.ok(ACTIVITIES.collectShells.weight({ ...base, lowTide: true }) > 0);
  assert.equal(ACTIVITIES.collectShells.weight({ ...base, lowTide: true, night: true }), 0);
});

test('o mergulho termina na água e ele volta para a areia', () => {
  const actor = new Actor({ energy: 'fishing', fixedActivity: 'dive', fixedVariant: 'clean', random: fixedRandom() });
  actor.interrupt(diveClean(actor));
  let reachedSea = false;
  let flew = false;
  for (let t = 0; t < 8; t += 0.05) {
    actor.update(0.05);
    if (actor.x < -154) reachedSea = true;
    if (actor.lift > 20) flew = true;
  }
  assert.ok(flew && reachedSea);
  for (let t = 0; t < 8; t += 0.05) actor.update(0.05);
  assert.ok(actor.lift >= 0);
});

test('na chuva, ele prefere se abrigar ou dançar', () => {
  const random = fixedRandom();
  const tally = {};
  for (let i = 0; i < 2000; i += 1) {
    const name = pickActivity({ energy: 'fishing', commits: 2, stars: 0, night: false, rain: true }, [], random);
    tally[name] = (tally[name] ?? 0) + 1;
  }
  assert.ok(tally.shelter > (tally.fish ?? 0) * 0.8);
  assert.ok(tally.rainDance > 0);
});

test('nenhuma atividade domina a rotina com clima variado', () => {
  for (const conditions of [{ rain: true }, { hot: true }, { lowTide: true }]) {
    const actor = new Actor({
      energy: 'fishing',
      commits: 4,
      stars: 120,
      conditions: () => conditions,
      random: fixedRandom(),
    });
    for (let t = 0; t < 3 * 3600; t += 0.1) actor.update(0.1);
    const total = Object.values(actor.timeSpent).reduce((sum, seconds) => sum + seconds, 0);
    for (const [name, seconds] of Object.entries(actor.timeSpent)) {
      assert.ok(seconds / total <= 0.26, `${name} ${Math.round((seconds / total) * 100)}%`);
    }
  }
});
