// Regras puras do sincronizador: sem rede e sem disco, para serem testáveis.

export const ACTIVITY_WINDOW_DAYS = 3;
export const MAX_FORKS = 1000;
export const MAX_FORK_DEPTH = 3;
export const FORK_REFRESH_BUDGET = 120;
export const REFRESH_SLOT_MS = 6 * 60 * 60 * 1000;
// A busca do GitHub aceita cerca de 30 requisições por minuto.
export const SEARCH_INTERVAL_MS = 2100;

export function energyLevel(commits) {
  if (commits <= 0) return 'sleeping';
  if (commits < 5) return 'fishing';
  return 'working';
}

// A busca conta commits públicos pela autoria, inclusive os enviados por merge na
// interface web, que nem sempre aparecem na API de eventos. O limite superior da
// janela ignora commits com data no futuro.
export function recentCommitsQuery(login, now = Date.now(), days = ACTIVITY_WINDOW_DAYS) {
  const iso = (time) => new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const from = iso(now - days * 24 * 60 * 60 * 1000);
  return `author:${login} author-date:${from}..${iso(now)}`;
}

export function isRateLimited(status, headers) {
  if (status === 429) return true;
  if (status !== 403) return false;
  return headers.get('x-ratelimit-remaining') === '0' || headers.has('retry-after');
}

// Lê as páginas de forks de um repositório, sem passar do teto, para que um único ramo
// muito grande não gaste todo o limite de requisições da API.
export async function listForkPages(fetchPage, limit = MAX_FORKS, pageSize = 100) {
  const children = [];
  for (let page = 1; children.length < limit; page += 1) {
    const batch = await fetchPage(page);
    children.push(...batch);
    if (batch.length < pageSize) break;
  }
  return children.slice(0, limit);
}

// Percorre a árvore de forks em largura. Só consulta os ramos que têm forks, e cada
// usuário entra uma vez, o que também impede laços. O dono da Mãe nunca vira fork.
export async function walkForkTree(
  fetchChildren,
  root,
  { motherOwner = root.split('/')[0], maxForks = MAX_FORKS, maxDepth = MAX_FORK_DEPTH } = {},
) {
  const found = [];
  const seen = new Set([motherOwner.toLowerCase()]);
  let level = [root];
  for (let depth = 1; depth <= maxDepth && level.length > 0 && found.length < maxForks; depth += 1) {
    const nextLevel = [];
    for (const parent of level) {
      if (found.length >= maxForks) break;
      for (const repo of await fetchChildren(parent)) {
        const login = repo.owner.login.toLowerCase();
        if (seen.has(login)) continue;
        seen.add(login);
        if (found.length < maxForks) found.push(repo);
        if ((repo.forks_count ?? 0) > 0) nextLevel.push(repo.full_name);
      }
    }
    level = nextLevel;
  }
  return found;
}

// Escolhe quais forks atualizar nesta execução: primeiro os inéditos, depois uma
// janela que gira a cada 6 horas, para que todos sejam visitados sem guardar estado.
export function pickForksToRefresh(forks, knownLogins, budget = FORK_REFRESH_BUDGET, now = Date.now()) {
  const fresh = forks.filter((fork) => !knownLogins.has(fork.login));
  const known = forks.filter((fork) => knownLogins.has(fork.login));
  const picked = fresh.slice(0, budget);
  const room = Math.min(budget - picked.length, known.length);
  if (room > 0) {
    const start = (Math.floor(now / REFRESH_SLOT_MS) * budget) % known.length;
    for (let offset = 0; offset < room; offset += 1) {
      picked.push(known[(start + offset) % known.length]);
    }
  }
  return picked;
}

export function toForkBase(repo) {
  return {
    login: repo.owner.login,
    avatar: repo.owner.avatar_url ?? '',
    repo: repo.name,
    url: repo.html_url,
    createdAt: repo.created_at,
    stars: repo.stargazers_count ?? 0,
  };
}

// Compara ignorando o carimbo de data, para não gerar commit sem mudança real.
export function sameContent(previous, next) {
  if (!previous) return false;
  const strip = ({ generatedAt, ...rest }) => rest;
  return JSON.stringify(strip(previous)) === JSON.stringify(strip(next));
}
