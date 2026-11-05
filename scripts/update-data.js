// Consolida a atividade pública do GitHub em data/arquipelago.json.
// Uso: GITHUB_TOKEN=... GITHUB_REPOSITORY=dono/repo node scripts/update-data.js

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import {
  FORK_REFRESH_BUDGET,
  MAX_BOTTLES,
  MAX_FORKS,
  SEARCH_INTERVAL_MS,
  energyLevel,
  isRateLimited,
  onlyRealIssues,
  pickForksToRefresh,
  recentCommitsQuery,
  resolveBottle,
  sameContent,
  toForkBase,
} from './lib.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'data', 'arquipelago.json');
const CATALOG = join(ROOT, 'data', 'garrafas.json');

class RateLimitError extends Error {}

class HttpError extends Error {
  constructor(status, path) {
    super(`GitHub respondeu ${status} em ${path}`);
    this.status = status;
  }
}

function createClient(token) {
  return async function api(path) {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'user-agent': 'git-castaway-sync',
        'x-github-api-version': '2022-11-28',
      },
    });
    if (isRateLimited(response.status, response.headers)) {
      throw new RateLimitError(`Limite da API atingido em ${path}`);
    }
    if (!response.ok) throw new HttpError(response.status, path);
    return response.json();
  };
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function fetchActivity(api, login) {
  const query = encodeURIComponent(recentCommitsQuery(login));
  const result = await api(`/search/commits?q=${query}&per_page=1`);
  const commits3d = result.total_count;
  return { commits3d, energia: energyLevel(commits3d) };
}

async function listForks(api, fullName) {
  const forks = [];
  for (let page = 1; forks.length < MAX_FORKS; page += 1) {
    const batch = await api(`/repos/${fullName}/forks?sort=oldest&per_page=100&page=${page}`);
    forks.push(...batch);
    if (batch.length < 100) break;
  }
  return forks.slice(0, MAX_FORKS).map(toForkBase);
}

// Falha ou limite em um fork não pode derrubar o arquipélago: a ilha mantém o
// último estado conhecido e será visitada de novo em uma próxima janela.
async function refreshForks(api, forks, previousByLogin) {
  const budget = Number(process.env.FORK_REFRESH_BUDGET) || FORK_REFRESH_BUDGET;
  const queue = pickForksToRefresh(forks, new Set(previousByLogin.keys()), budget);
  const refreshed = new Map();

  for (const fork of queue) {
    await wait(SEARCH_INTERVAL_MS);
    try {
      refreshed.set(fork.login, await fetchActivity(api, fork.login));
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.warn('Limite da API atingido. Os demais forks ficam para a próxima execução.');
        break;
      }
      if (!(error instanceof HttpError)) throw error;
      console.warn(`Ignorando atividade de ${fork.login}: ${error.message}`);
    }
  }

  console.log(`Forks: ${forks.length} no total, ${refreshed.size} atualizados nesta execução.`);
  return refreshed;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const fullName = process.env.GITHUB_REPOSITORY;
  if (!token || !fullName) throw new Error('Defina GITHUB_TOKEN e GITHUB_REPOSITORY.');

  const api = createClient(token);
  const [catalog, previous] = await Promise.all([readJson(CATALOG), readJson(OUTPUT)]);
  const repo = await api(`/repos/${fullName}`);
  const owner = repo.owner.login;
  const pagesUrl = `https://${owner.toLowerCase()}.github.io/${repo.name}/`;

  const [ownerActivity, recentIssues, issueCount, forkBases] = await Promise.all([
    fetchActivity(api, owner),
    api(`/repos/${fullName}/issues?state=open&sort=created&direction=desc&per_page=${MAX_BOTTLES}`),
    api(`/search/issues?q=${encodeURIComponent(`repo:${fullName} is:issue is:open`)}&per_page=1`),
    listForks(api, fullName),
  ]);

  const previousByLogin = new Map((previous?.forks ?? []).map((fork) => [fork.login, fork]));
  const refreshed = await refreshForks(api, forkBases, previousByLogin);

  const forks = forkBases.map((fork) => {
    const known = previousByLogin.get(fork.login);
    const activity = refreshed.get(fork.login) ?? {
      commits3d: known?.commits3d ?? 0,
      energia: known?.energia ?? 'dormindo',
    };
    return { ...fork, ...activity };
  });

  const next = {
    versao: 1,
    geradoEm: new Date().toISOString(),
    mae: { owner, repo: repo.name, url: repo.html_url, pagesUrl },
    ilhaPrincipal: {
      login: owner,
      avatar: repo.owner.avatar_url ?? '',
      url: repo.html_url,
      pagesUrl,
      criadoEm: repo.created_at,
      estrelas: repo.stargazers_count,
      ...ownerActivity,
    },
    issuesAbertas: issueCount.total_count,
    garrafas: onlyRealIssues(recentIssues).map((issue) => resolveBottle(issue, catalog)),
    totalForks: repo.forks_count,
    forks,
  };

  if (sameContent(previous, next)) {
    console.log('Nenhuma mudança real. Arquivo mantido.');
    return;
  }
  await writeFile(OUTPUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `Arquivo atualizado: ${next.ilhaPrincipal.estrelas} estrelas, ${next.issuesAbertas} issues, ${forks.length} forks.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
