import { LOCAL_DATA_URL, MOTHER_OWNER, MOTHER_PAGES_URL, MOTHER_REPO, MOTHER_REPO_URL } from './config.js';

const LOGIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const ENERGY_LEVELS = new Set(['sleeping', 'fishing', 'working']);

export function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

// Perfil público do dono da ilha no GitHub.
export function profileUrl(login) {
  return LOGIN_PATTERN.test(login ?? '') ? `https://github.com/${login}` : null;
}

// Controles de teste de cenas e horários. Só existem em ambiente local.
export function devOptions(location) {
  if (!isLocalHost(location.hostname)) return {};
  const params = new URLSearchParams(location.search);
  const hour = Number(params.get('hour'));
  const date = new Date(params.get('date'));
  const tide = Number(params.get('tide'));
  return {
    activity: params.get('activity'),
    variant: params.get('variant'),
    hour: params.has('hour') && Number.isFinite(hour) ? hour : null,
    view: params.get('view'),
    date: params.has('date') && !Number.isNaN(date.getTime()) ? date : null,
    weather: params.get('weather'),
    tide: params.has('tide') && Number.isFinite(tide) ? tide : null,
    intro: params.get('intro') === '1',
  };
}

// A URL pública é uma só. Quem abre a página de um fork vai para a ilha dessa pessoa
// na URL da Mãe. Isso é um padrão, não um bloqueio: o dono pode editar a própria cópia.
export function forkRedirectUrl(location, motherOwner = MOTHER_OWNER) {
  const match = location.hostname.toLowerCase().match(/^([a-z0-9-]+)\.github\.io$/);
  if (!match || match[1] === motherOwner.toLowerCase()) return null;
  return `${MOTHER_PAGES_URL}?ilha=${encodeURIComponent(match[1])}`;
}

// `?ilha=login` é o endereço de cada ilha dentro da URL da Mãe.
export function requestedIsland(location) {
  const requested = new URLSearchParams(location.search).get('ilha');
  return requested && LOGIN_PATTERN.test(requested) ? requested : null;
}

export function emptyData() {
  return {
    version: 1,
    generatedAt: null,
    mother: { owner: MOTHER_OWNER, repo: MOTHER_REPO, url: MOTHER_REPO_URL },
    mainIsland: {
      login: MOTHER_OWNER,
      avatar: '',
      url: MOTHER_REPO_URL,
      createdAt: null,
      stars: 0,
      commits3d: 0,
      energy: 'sleeping',
    },
    totalForks: 0,
    forks: [],
  };
}

function httpsOrNull(value) {
  return typeof value === 'string' && value.startsWith('https://') ? value : null;
}

function normalizeIsland(raw) {
  return {
    login: String(raw.login ?? ''),
    avatar: httpsOrNull(raw.avatar),
    url: httpsOrNull(raw.url),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
    stars: Math.max(0, Number(raw.stars) || 0),
    commits3d: Math.max(0, Number(raw.commits3d) || 0),
    energy: ENERGY_LEVELS.has(raw.energy) ? raw.energy : 'sleeping',
  };
}

export function normalizeData(raw) {
  const base = emptyData();
  return {
    ...base,
    ...raw,
    mother: { ...base.mother, ...raw?.mother },
    mainIsland: normalizeIsland({ ...base.mainIsland, ...raw?.mainIsland }),
    forks: Array.isArray(raw?.forks) ? raw.forks.map(normalizeIsland) : [],
  };
}

export function dataSources(location) {
  if (isLocalHost(location.hostname)) {
    const fixture = new URLSearchParams(location.search).get('data');
    return [fixture && /^test\/fixtures\/[\w-]+\.json$/.test(fixture) ? fixture : LOCAL_DATA_URL];
  }
  return [LOCAL_DATA_URL];
}

export async function loadData(location, fetcher = fetch) {
  for (const source of dataSources(location)) {
    try {
      const response = await fetcher(source);
      if (response.ok) return { data: normalizeData(await response.json()), online: true };
    } catch (error) {
      console.warn(`Could not read ${source}`, error);
    }
  }
  return { data: normalizeData(emptyData()), online: false };
}

// Todas as ilhas do arquipélago: a principal primeiro e depois os forks. Quem ainda não
// está nos dados, como um fork recém-criado, ganha uma ilha nova ao final da lista.
export function buildIslandSpecs(data, wantedLogin = null) {
  const main = { ...data.mainIsland, isMain: true };
  const forks = data.forks.map((fork) => ({ ...fork, isMain: false }));
  const specs = [main, ...forks];
  if (!wantedLogin || findIslandSpec(specs, wantedLogin)) return specs;
  return [
    ...specs,
    {
      login: wantedLogin,
      avatar: null,
      url: null,
      createdAt: null,
      stars: 0,
      commits3d: 0,
      energy: 'sleeping',
      isMain: false,
    },
  ];
}

export function findIslandSpec(specs, login) {
  const wanted = login.toLowerCase();
  return specs.find((spec) => spec.login.toLowerCase() === wanted) ?? null;
}
