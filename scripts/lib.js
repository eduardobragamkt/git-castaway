// Regras puras do sincronizador: sem rede e sem disco, para serem testáveis.

export const ACTIVITY_WINDOW_DAYS = 3;
export const BOTTLE_FIELD_LABEL = 'Mensagem da garrafa';
export const MAX_FORKS = 1000;
export const FORK_REFRESH_BUDGET = 120;
export const MAX_BOTTLES = 20;
export const REFRESH_SLOT_MS = 6 * 60 * 60 * 1000;
// A busca do GitHub aceita cerca de 30 requisições por minuto.
export const SEARCH_INTERVAL_MS = 2100;

export function energyLevel(commits) {
  if (commits <= 0) return 'dormindo';
  if (commits < 5) return 'pescando';
  return 'trabalhando';
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

export function optionText(message) {
  return `${message.pt} / ${message.en}`;
}

// Lê a resposta do dropdown no corpo Markdown gerado por um Issue Form.
export function parseBottleSelection(body) {
  if (typeof body !== 'string') return null;
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `### ${BOTTLE_FIELD_LABEL}`);
  if (start < 0) return null;
  for (const line of lines.slice(start + 1)) {
    const text = line.trim();
    if (!text) continue;
    return text.startsWith('#') ? null : text;
  }
  return null;
}

// Só devolve texto que já está no catálogo versionado. O texto do autor da Issue
// nunca é copiado, mesmo quando ela foi criada pela API sem passar pelo formulário.
export function resolveBottle(issue, catalog) {
  const selection = parseBottleSelection(issue.body);
  const message =
    catalog.mensagens.find((candidate) => optionText(candidate) === selection) ?? catalog.fallback;
  return { numero: issue.number, id: message.id, pt: message.pt, en: message.en };
}

// O endpoint /issues também devolve pull requests.
export function onlyRealIssues(items) {
  return items.filter((item) => !item.pull_request);
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
  const login = repo.owner.login;
  return {
    login,
    avatar: repo.owner.avatar_url ?? '',
    repo: repo.name,
    url: repo.html_url,
    pagesUrl: repo.has_pages ? `https://${login.toLowerCase()}.github.io/${repo.name}/` : null,
    criadoEm: repo.created_at,
    estrelas: repo.stargazers_count ?? 0,
  };
}

// Compara ignorando o carimbo de data, para não gerar commit sem mudança real.
export function sameContent(previous, next) {
  if (!previous) return false;
  const strip = ({ geradoEm, ...rest }) => rest;
  return JSON.stringify(strip(previous)) === JSON.stringify(strip(next));
}
