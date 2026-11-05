import assert from 'node:assert/strict';
import test from 'node:test';
import { BOTTLE_LIFETIME_MS, BOTTLE_REREAD_MS, activeBottles, canReadBottle } from '../js/bottles.js';

const NOW = Date.parse('2026-11-05T12:00:00Z');
const openedAgo = (ms) => ({ abertaEm: new Date(NOW - ms).toISOString() });

test('a garrafa dura exatamente 30 minutos desde a abertura da Issue', () => {
  assert.equal(BOTTLE_LIFETIME_MS, 30 * 60 * 1000);
  assert.equal(activeBottles([openedAgo(0)], NOW).length, 1);
  assert.equal(activeBottles([openedAgo(BOTTLE_LIFETIME_MS - 1)], NOW).length, 1);
  assert.equal(activeBottles([openedAgo(BOTTLE_LIFETIME_MS)], NOW).length, 0);
  assert.equal(activeBottles([openedAgo(BOTTLE_LIFETIME_MS * 4)], NOW).length, 0);
});

test('só as garrafas dentro da validade permanecem', () => {
  const fresh = openedAgo(60 * 1000);
  const old = openedAgo(BOTTLE_LIFETIME_MS + 1);
  assert.deepEqual(activeBottles([old, fresh], NOW), [fresh]);
});

test('garrafa sem data válida não aparece', () => {
  assert.deepEqual(activeBottles([{ id: 'antiga' }, { abertaEm: 'ontem' }, { abertaEm: null }], NOW), []);
});

test('o náufrago lê uma vez e só lê de novo depois de 5 minutos', () => {
  assert.equal(BOTTLE_REREAD_MS, 5 * 60 * 1000);
  assert.equal(canReadBottle(NaN, NOW), true);
  assert.equal(canReadBottle(NOW, NOW), false);
  assert.equal(canReadBottle(NOW - BOTTLE_REREAD_MS + 1, NOW), false);
  assert.equal(canReadBottle(NOW - BOTTLE_REREAD_MS, NOW), true);
});

test('em 30 minutos de vida há no máximo 7 leituras', () => {
  let lastRead = NaN;
  let reads = 0;
  for (let elapsed = 0; elapsed < BOTTLE_LIFETIME_MS; elapsed += 1000) {
    if (canReadBottle(lastRead, NOW + elapsed)) {
      lastRead = NOW + elapsed;
      reads += 1;
    }
  }
  assert.ok(reads <= 7, `${reads} leituras`);
});

test('relógio adiantado no registro não bloqueia a leitura para sempre', () => {
  assert.equal(canReadBottle(NOW + 60 * 1000, NOW), true);
});
