import assert from 'node:assert/strict';
import test from 'node:test';
import { TEXTS } from '../js/i18n.js';
import {
  INTRO,
  canSkipIntro,
  curtainOpacity,
  easeInOut,
  introLines,
  introTake,
  shouldPlayIntro,
  takeProgress,
  typedText,
} from '../js/intro.js';
import { introBottle } from '../js/scene/activities.js';
import { Actor } from '../js/scene/actor.js';

const base = { seen: false, wantedIsland: null, reducedMotion: false };

test('a abertura aparece só na primeira visita', () => {
  assert.equal(shouldPlayIntro(base), true);
  assert.equal(shouldPlayIntro({ ...base, seen: true }), false);
});

test('link direto de ilha, menos movimento e testes não abrem a sequência', () => {
  assert.equal(shouldPlayIntro({ ...base, wantedIsland: 'maria' }), false);
  assert.equal(shouldPlayIntro({ ...base, reducedMotion: true }), false);
  assert.equal(shouldPlayIntro({ ...base, testingScene: true }), false);
  assert.equal(shouldPlayIntro({ ...base, seen: true, forced: true }), true);
});

test('as tomadas seguem a ordem combinada e terminam em 12 segundos', () => {
  assert.equal(INTRO.end, 12);
  const at = [0, 1.9, 2, 4.9, 5, 7.9, 8, 9.9, 10, 11.9].map(introTake);
  assert.deepEqual(at, [
    'terminal',
    'terminal',
    'sea',
    'sea',
    'bottle',
    'bottle',
    'archipelago',
    'archipelago',
    'descent',
    'descent',
  ]);
});

test('o texto usa dados reais e os dois idiomas', () => {
  const en = introLines(9, 42, TEXTS.en).map((line) => line.text);
  const pt = introLines(9, 42, TEXTS.pt).map((line) => line.text);
  assert.equal(en[2], '$ git commit -m "day 9"');
  assert.equal(en[0], pt[0]);
  assert.equal(en[3], '42 islands and counting.');
  assert.equal(pt[3], '42 ilhas e contando.');
  assert.equal(introLines(1, 1, TEXTS.en)[3].text, '1 island and counting.');
  assert.equal(introLines(1, 1, TEXTS.pt)[3].text, '1 ilha e contando.');
  assert.equal(en[4], 'Welcome to Git Castaway.');
  assert.equal(pt[4], 'Bem-vindo ao Git Castaway.');
});

test('as linhas têm tempo para terminar de digitar antes da próxima', () => {
  const lines = introLines(1234, 1000, TEXTS.pt);
  lines.forEach((line, index) => {
    const next = lines[index + 1]?.at ?? INTRO.end;
    assert.equal(typedText(line, next - 0.01), line.text);
  });
  assert.equal(typedText(lines[0], 0), '');
});

test('o pulo espera um instante para não capturar o clique que iniciou a repetição', () => {
  assert.equal(canSkipIntro(0.1), false);
  assert.equal(canSkipIntro(0.3), true);
});

test('a cortina some na passagem para o mar', () => {
  assert.equal(curtainOpacity(0), 1);
  assert.equal(curtainOpacity(INTRO.sea - 0.2), 1);
  assert.equal(curtainOpacity(INTRO.sea + 0.3), 0);
});

test('o movimento da câmera começa e termina suave', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.equal(takeProgress(5, 5, 8), 0);
  assert.equal(takeProgress(9, 5, 8), 1);
});

test('a tomada da garrafa cabe no tempo e termina com ele na ilha', () => {
  const events = [];
  const actor = new Actor({ energy: 'dormindo', onEvent: (event) => events.push(event) });
  actor.x = 92;
  actor.y = 48;
  actor.interrupt(introBottle());
  for (let t = 0; t < 3; t += 0.05) actor.update(0.05);
  assert.deepEqual(events.slice(0, 2), ['bottleArrive', 'bottlePick']);
  assert.equal(actor.item === null || actor.item === 'paper', true);
  assert.ok(Math.abs(actor.x) <= 152);
});
