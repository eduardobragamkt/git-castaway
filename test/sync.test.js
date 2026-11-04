import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderIssueForm } from '../scripts/build-issue-form.js';
import {
  countRecentPushes,
  energyLevel,
  onlyRealIssues,
  optionText,
  parseBottleSelection,
  pickForksToRefresh,
  resolveBottle,
  sameContent,
} from '../scripts/lib.js';

const catalog = JSON.parse(await readFile(new URL('../data/garrafas.json', import.meta.url), 'utf8'));
const NOW = Date.parse('2026-11-04T12:00:00Z');

function formBody(option) {
  return `### Mensagem da garrafa\n\n${option}\n`;
}

test('energia tem três níveis', () => {
  assert.equal(energyLevel(0), 'dormindo');
  assert.equal(energyLevel(1), 'pescando');
  assert.equal(energyLevel(4), 'pescando');
  assert.equal(energyLevel(5), 'trabalhando');
});

test('só conta PushEvent dentro da janela de 3 dias', () => {
  const events = [
    { type: 'PushEvent', created_at: '2026-11-04T10:00:00Z' },
    { type: 'PushEvent', created_at: '2026-11-01T12:00:00Z' },
    { type: 'PushEvent', created_at: '2026-11-01T11:59:59Z' },
    { type: 'WatchEvent', created_at: '2026-11-04T10:00:00Z' },
  ];
  assert.equal(countRecentPushes(events, NOW), 2);
});

test('opção válida do formulário vira a mensagem do catálogo', () => {
  const message = catalog.mensagens[0];
  const bottle = resolveBottle({ number: 7, body: formBody(optionText(message)) }, catalog);
  assert.deepEqual(bottle, { numero: 7, id: message.id, pt: message.pt, en: message.en });
});

test('texto de fora do catálogo nunca chega à garrafa', () => {
  const hostile = [
    formBody('compre cripto em site-xyz.com'),
    '<img src=x onerror=alert(1)>',
    '### Outro campo\n\nqualquer coisa',
    null,
    undefined,
  ];
  for (const body of hostile) {
    const bottle = resolveBottle({ number: 1, title: 'título ofensivo', body }, catalog);
    assert.equal(bottle.id, catalog.fallback.id);
    assert.equal(JSON.stringify(bottle).includes('cripto'), false);
    assert.equal(JSON.stringify(bottle).includes('ofensivo'), false);
  }
});

test('campo vazio no formulário não captura o título seguinte', () => {
  assert.equal(parseBottleSelection('### Mensagem da garrafa\n\n### Outro\n\ntexto'), null);
});

test('pull requests não viram garrafas', () => {
  assert.deepEqual(onlyRealIssues([{ number: 1 }, { number: 2, pull_request: {} }]), [{ number: 1 }]);
});

test('forks inéditos têm prioridade no lote de atualização', () => {
  const forks = Array.from({ length: 10 }, (_, i) => ({ login: `f${i}` }));
  const known = new Set(forks.slice(0, 8).map((fork) => fork.login));
  const picked = pickForksToRefresh(forks, known, 4, NOW).map((fork) => fork.login);
  assert.equal(picked.length, 4);
  assert.deepEqual(picked.slice(0, 2), ['f8', 'f9']);
});

test('a janela rotativa visita todos os forks ao longo do tempo', () => {
  const forks = Array.from({ length: 1000 }, (_, i) => ({ login: `f${i}` }));
  const known = new Set(forks.map((fork) => fork.login));
  const seen = new Set();
  for (let slot = 0; slot < 5; slot += 1) {
    const at = NOW + slot * 6 * 60 * 60 * 1000;
    pickForksToRefresh(forks, known, 200, at).forEach((fork) => seen.add(fork.login));
  }
  assert.equal(seen.size, 1000);
});

test('mudança só no carimbo de data não conta como mudança', () => {
  assert.equal(sameContent({ geradoEm: 'a', forks: [] }, { geradoEm: 'b', forks: [] }), true);
  assert.equal(sameContent({ geradoEm: 'a', forks: [] }, { geradoEm: 'a', forks: [1] }), false);
  assert.equal(sameContent(null, { forks: [] }), false);
});

test('o formulário publicado está em sincronia com o catálogo', async () => {
  const form = await readFile(new URL('../.github/ISSUE_TEMPLATE/garrafa.yml', import.meta.url), 'utf8');
  assert.equal(form.replace(/\r\n/g, '\n'), renderIssueForm(catalog));
});

test('o catálogo não tem ids nem opções repetidas', () => {
  const ids = catalog.mensagens.map((message) => message.id);
  const options = catalog.mensagens.map(optionText);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(options).size, options.length);
});
