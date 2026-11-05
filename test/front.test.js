import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildIslandSpecs,
  dataSources,
  emptyData,
  findIslandSpec,
  forkRedirectUrl,
  normalizeData,
  requestedIsland,
} from '../js/core/data.js';
import { MOTHER_PAGES_URL } from '../js/core/config.js';
import { islandPosition } from '../js/map/layout.js';
import { FRAMES, PALETTE } from '../js/map/sprite-data.js';

function place(hostname, search = '') {
  return { hostname, search };
}

test('a URL da Mãe e o ambiente local não redirecionam', () => {
  assert.equal(forkRedirectUrl(place('eduardobragamkt.github.io')), null);
  assert.equal(forkRedirectUrl(place('EDUARDOBRAGAMKT.github.io')), null);
  assert.equal(forkRedirectUrl(place('localhost')), null);
  assert.equal(forkRedirectUrl(place('example.com')), null);
});

test('a página de um fork leva à ilha da pessoa na URL única', () => {
  assert.equal(forkRedirectUrl(place('maria-dev.github.io')), `${MOTHER_PAGES_URL}?ilha=maria-dev`);
});

test('?ilha aceita apenas um login válido', () => {
  assert.equal(requestedIsland(place('localhost', '?ilha=maria')), 'maria');
  assert.equal(requestedIsland(place('localhost', '?ilha=<script>')), null);
  assert.equal(requestedIsland(place('localhost', '?ilha=a/b')), null);
  assert.equal(requestedIsland(place('localhost')), null);
});

test('os dados vêm sempre da própria URL pública', () => {
  assert.deepEqual(dataSources(place('eduardobragamkt.github.io')), ['data/archipelago.json']);
});

test('fixtures só valem em ambiente local e dentro da pasta de testes', () => {
  assert.equal(dataSources(place('localhost', '?data=test/fixtures/demo.json'))[0], 'test/fixtures/demo.json');
  assert.equal(dataSources(place('localhost', '?data=../segredo.json'))[0], 'data/archipelago.json');
  assert.equal(dataSources(place('eduardobragamkt.github.io', '?data=test/fixtures/demo.json'))[0], 'data/archipelago.json');
});

test('o arquipélago encontra o fork e cria ilha nova para quem ainda não está nos dados', () => {
  const data = normalizeData({
    ...emptyData(),
    forks: [{ login: 'Maria', stars: 2, commits3d: 6, energy: 'working' }],
  });
  const all = buildIslandSpecs(data);
  assert.equal(all.length, 2);
  assert.equal(all[0].isMain, true);
  assert.equal(findIslandSpec(all, 'maria').energy, 'working');
  assert.equal(buildIslandSpecs(data, 'maria').length, 2);
  const withNew = buildIslandSpecs(data, 'novo-fork');
  assert.equal(withNew.length, 3);
  assert.equal(findIslandSpec(withNew, 'novo-fork').energy, 'sleeping');
});

test('dados inválidos são saneados', () => {
  const data = normalizeData({
    mainIsland: { login: 'x', energy: 'hackeado', stars: 'muitas', avatar: 'javascript:alert(1)' },
  });
  assert.equal(data.mainIsland.energy, 'sleeping');
  assert.equal(data.mainIsland.stars, 0);
  assert.equal(data.mainIsland.avatar, null);
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
