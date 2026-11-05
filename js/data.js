import { LOCAL_DATA_URL, MOTHER_OWNER, MOTHER_PAGES_URL, MOTHER_REPO, MOTHER_REPO_URL } from './config.js';

const LOGIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const ENERGY_LEVELS = new Set(['dormindo', 'pescando', 'trabalhando']);

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
  const hour = Number(params.get('hora'));
  const date = new Date(params.get('data'));
  const tide = Number(params.get('mare'));
  return {
    activity: params.get('cena'),
    variant: params.get('variante'),
    hour: params.has('hora') && Number.isFinite(hour) ? hour : null,
    view: params.get('visao'),
    date: params.has('data') && !Number.isNaN(date.getTime()) ? date : null,
    weather: params.get('clima'),
    tide: params.has('mare') && Number.isFinite(tide) ? tide : null,
    intro: params.get('abertura') === '1',
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
    versao: 1,
    geradoEm: null,
    mae: { owner: MOTHER_OWNER, repo: MOTHER_REPO, url: MOTHER_REPO_URL },
    ilhaPrincipal: {
      login: MOTHER_OWNER,
      avatar: '',
      url: MOTHER_REPO_URL,
      criadoEm: null,
      estrelas: 0,
      commits3d: 0,
      energia: 'dormindo',
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
    criadoEm: typeof raw.criadoEm === 'string' ? raw.criadoEm : null,
    estrelas: Math.max(0, Number(raw.estrelas) || 0),
    commits3d: Math.max(0, Number(raw.commits3d) || 0),
    energia: ENERGY_LEVELS.has(raw.energia) ? raw.energia : 'dormindo',
  };
}

export function normalizeData(raw) {
  const base = emptyData();
  return {
    ...base,
    ...raw,
    mae: { ...base.mae, ...raw?.mae },
    ilhaPrincipal: normalizeIsland({ ...base.ilhaPrincipal, ...raw?.ilhaPrincipal }),
    forks: Array.isArray(raw?.forks) ? raw.forks.map(normalizeIsland) : [],
  };
}

export function dataSources(location) {
  if (isLocalHost(location.hostname)) {
    const fixture = new URLSearchParams(location.search).get('dados');
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
      console.warn(`Não foi possível ler ${source}`, error);
    }
  }
  return { data: normalizeData(emptyData()), online: false };
}

// Todas as ilhas do arquipélago: a principal primeiro e depois os forks. Quem ainda não
// está nos dados, como um fork recém-criado, ganha uma ilha nova ao final da lista.
export function buildIslandSpecs(data, wantedLogin = null) {
  const main = { ...data.ilhaPrincipal, principal: true };
  const forks = data.forks.map((fork) => ({ ...fork, principal: false }));
  const specs = [main, ...forks];
  if (!wantedLogin || findIslandSpec(specs, wantedLogin)) return specs;
  return [
    ...specs,
    {
      login: wantedLogin,
      avatar: null,
      url: null,
      criadoEm: null,
      estrelas: 0,
      commits3d: 0,
      energia: 'dormindo',
      principal: false,
    },
  ];
}

export function findIslandSpec(specs, login) {
  const wanted = login.toLowerCase();
  return specs.find((spec) => spec.login.toLowerCase() === wanted) ?? null;
}
