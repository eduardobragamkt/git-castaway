import assert from 'node:assert/strict';
import test from 'node:test';
import { BOTTLE_MESSAGES } from '../js/scene/messages.js';
import { STAR_UPGRADES } from '../js/upgrades.js';
import {
  energyLevel,
  isRateLimited,
  pickForksToRefresh,
  recentCommitsQuery,
  sameContent,
  toForkBase,
  walkForkTree,
} from '../scripts/lib.js';

const NOW = Date.parse('2026-11-04T12:00:00Z');

function repo(login, forksCount = 0) {
  return { owner: { login }, full_name: `${login}/git-castaway`, forks_count: forksCount };
}

test('energia tem três níveis', () => {
  assert.equal(energyLevel(0), 'dormindo');
  assert.equal(energyLevel(1), 'pescando');
  assert.equal(energyLevel(4), 'pescando');
  assert.equal(energyLevel(5), 'trabalhando');
});

test('a busca cobre os últimos 3 dias e ignora datas no futuro', () => {
  assert.equal(
    recentCommitsQuery('maria-dev', NOW),
    'author:maria-dev author-date:2026-11-01T12:00:00Z..2026-11-04T12:00:00Z',
  );
});

test('reconhece limite de requisições da busca', () => {
  const headers = (entries) => new Headers(entries);
  assert.equal(isRateLimited(429, headers({})), true);
  assert.equal(isRateLimited(403, headers({ 'x-ratelimit-remaining': '0' })), true);
  assert.equal(isRateLimited(403, headers({ 'retry-after': '60' })), true);
  assert.equal(isRateLimited(403, headers({ 'x-ratelimit-remaining': '12' })), false);
  assert.equal(isRateLimited(422, headers({ 'x-ratelimit-remaining': '0' })), false);
});

test('forks de forks entram no arquipélago e só os ramos com forks são consultados', async () => {
  const tree = {
    'mae/git-castaway': [repo('ana', 1), repo('bia')],
    'ana/git-castaway': [repo('caio', 1)],
    'caio/git-castaway': [repo('duda')],
  };
  const asked = [];
  const found = await walkForkTree(async (parent) => {
    asked.push(parent);
    return tree[parent] ?? [];
  }, 'mae/git-castaway');
  assert.deepEqual(found.map((item) => item.owner.login), ['ana', 'bia', 'caio', 'duda']);
  assert.deepEqual(asked, ['mae/git-castaway', 'ana/git-castaway', 'caio/git-castaway']);
});

test('a busca de forks respeita profundidade, teto e usuários repetidos', async () => {
  const deep = async (parent) => {
    const level = Number(parent.match(/\d+/)?.[0] ?? 0);
    return [repo(`u${level + 1}`, 1)];
  };
  const limited = await walkForkTree(deep, 'mae/git-castaway', { maxDepth: 3 });
  assert.equal(limited.length, 3);

  const many = async () => Array.from({ length: 50 }, (_, i) => repo(`u${i}`));
  assert.equal((await walkForkTree(many, 'mae/git-castaway', { maxForks: 10 })).length, 10);

  const repeated = async (parent) => (parent.startsWith('mae') ? [repo('MAE'), repo('ana', 1)] : [repo('Ana'), repo('mae')]);
  const unique = await walkForkTree(repeated, 'mae/git-castaway');
  assert.deepEqual(unique.map((item) => item.owner.login), ['ana']);
});

test('a ilha de um fork guarda só dados públicos, sem link para página de terceiros', () => {
  const base = toForkBase({
    owner: { login: 'maria', avatar_url: 'https://avatars.example/maria' },
    name: 'git-castaway',
    html_url: 'https://github.com/maria/git-castaway',
    created_at: '2026-11-01T00:00:00Z',
    stargazers_count: 2,
    has_pages: true,
  });
  assert.equal('pagesUrl' in base, false);
  assert.equal(base.estrelas, 2);
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

test('melhorias e mensagens não dão uma embarcação para sair da ilha', () => {
  const vessel = /jangada|canoa|barco|raft|canoe|\bboat\b/i;
  for (const upgrade of STAR_UPGRADES) {
    assert.doesNotMatch(`${upgrade.sprite} ${upgrade.pt} ${upgrade.en}`, vessel);
  }
  for (const message of BOTTLE_MESSAGES) {
    assert.doesNotMatch(`${message.id} ${message.pt} ${message.en}`, vessel);
  }
});
