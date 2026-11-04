import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIslandSpecs, dataSources, emptyData, normalizeData, resolveMode } from '../js/data.js';
import { MOTHER_DATA_URL } from '../js/config.js';
import { islandPosition } from '../js/layout.js';
import { FRAMES, PALETTE } from '../js/sprite-data.js';

function place(hostname, search = '') {
  return { hostname, search };
}

test('a URL da Mãe abre o arquipélago', () => {
  assert.equal(resolveMode(place('eduardobragamkt.github.io')).mode, 'arquipelago');
  assert.equal(resolveMode(place('EDUARDOBRAGAMKT.github.io')).mode, 'arquipelago');
  assert.equal(resolveMode(place('localhost')).mode, 'arquipelago');
});

test('a URL de um fork abre o modo solo daquele usuário', () => {
  assert.deepEqual(resolveMode(place('maria-dev.github.io')), { mode: 'solo', login: 'maria-dev' });
});

test('?ilha aceita apenas um login válido', () => {
  assert.equal(resolveMode(place('localhost', '?ilha=maria')).login, 'maria');
  assert.equal(resolveMode(place('localhost', '?ilha=<script>')).mode, 'arquipelago');
});

test('um fork lê primeiro o JSON da Mãe', () => {
  assert.equal(dataSources(place('maria-dev.github.io'))[0], MOTHER_DATA_URL);
});

test('fixtures só valem em ambiente local e dentro da pasta de testes', () => {
  assert.equal(dataSources(place('localhost', '?dados=test/fixtures/demo.json'))[0], 'test/fixtures/demo.json');
  assert.equal(dataSources(place('localhost', '?dados=../segredo.json'))[0], 'data/arquipelago.json');
  assert.equal(dataSources(place('maria-dev.github.io', '?dados=test/fixtures/demo.json'))[0], MOTHER_DATA_URL);
});

test('modo solo encontra o fork e cria ilha nova para quem ainda não está no JSON', () => {
  const data = normalizeData({
    ...emptyData(),
    forks: [{ login: 'Maria', estrelas: 2, pushes3d: 6, energia: 'trabalhando' }],
  });
  const found = buildIslandSpecs(data, { mode: 'solo', login: 'maria' });
  assert.equal(found.length, 1);
  assert.equal(found[0].energia, 'trabalhando');
  const missing = buildIslandSpecs(data, { mode: 'solo', login: 'novo-fork' });
  assert.equal(missing[0].login, 'novo-fork');
  assert.equal(missing[0].energia, 'dormindo');
});

test('dados inválidos são saneados', () => {
  const data = normalizeData({
    ilhaPrincipal: { login: 'x', energia: 'hackeado', estrelas: 'muitas', avatar: 'javascript:alert(1)' },
  });
  assert.equal(data.ilhaPrincipal.energia, 'dormindo');
  assert.equal(data.ilhaPrincipal.estrelas, 0);
  assert.equal(data.ilhaPrincipal.avatar, null);
});

test('as ilhas não se sobrepõem, mesmo com 1000 forks', () => {
  const positions = Array.from({ length: 1001 }, (_, index) => islandPosition(index));
  for (let a = 0; a < positions.length; a += 1) {
    const width = a === 0 ? 178 : 170;
    for (let b = a + 1; b < positions.length; b += 1) {
      const dx = Math.abs(positions[a].x - positions[b].x);
      const dy = Math.abs(positions[a].y - positions[b].y);
      assert.ok(dx >= width || dy >= 140, `ilhas ${a} e ${b} sobrepostas (${dx}, ${dy})`);
    }
  }
});

test('a ilha principal fica no centro do mundo', () => {
  assert.deepEqual(islandPosition(0), { x: 0, y: 0 });
});

test('cada sprite tem linhas de mesma largura e só usa cores da paleta', () => {
  for (const [name, rows] of Object.entries(FRAMES)) {
    const width = rows[0].length;
    for (const row of rows) {
      assert.equal(row.length, width, `${name}: "${row}"`);
      for (const code of row) assert.ok(code === '.' || PALETTE[code], `${name}: cor ${code}`);
    }
  }
});
