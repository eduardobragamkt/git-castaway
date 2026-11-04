import { MOTHER_REPO_URL } from './config.js';
import { buildIslandSpecs, loadData, resolveMode } from './data.js';
import { Island } from './island.js';
import { islandPosition, worldBounds } from './layout.js';
import { drawOcean } from './ocean.js';

const LANGUAGE = (navigator.language ?? 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
const TEXT = {
  pt: {
    archipelago: 'Modo Arquipélago: arraste para navegar',
    solo: 'Modo Solo',
    offline: 'Sem dados do GitHub no momento',
    back: 'Voltar à ilha principal',
    bottle: 'Mandar garrafa',
    fork: 'Criar minha ilha',
    open: 'Ver repositório',
    visit: 'Visitar ilha',
    pushes: 'pushes em 3 dias',
    energy: { dormindo: 'Dormindo', pescando: 'Pescando', trabalhando: 'Trabalhando' },
    close: 'Fechar',
  },
  en: {
    archipelago: 'Archipelago mode: drag to explore',
    solo: 'Solo mode',
    offline: 'GitHub data is unavailable right now',
    back: 'Back to main island',
    bottle: 'Send a bottle',
    fork: 'Create my island',
    open: 'View repository',
    visit: 'Visit island',
    pushes: 'pushes in 3 days',
    energy: { dormindo: 'Sleeping', pescando: 'Fishing', trabalhando: 'Working' },
    close: 'Close',
  },
}[LANGUAGE];

const BOTTLE_INTERVAL = 26;
const DRAG_THRESHOLD = 5;

const canvas = document.getElementById('mar');
const ctx = canvas.getContext('2d');
const balloon = document.getElementById('balao');
const card = document.getElementById('cartao');
const camera = { x: 0, y: 0 };
const view = { left: 0, right: 0, top: 0, bottom: 0 };

let S = 3;
let dpr = 1;
let islands = [];
let bounds = null;
let modeInfo = null;
let readingIsland = null;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  const smallestSide = Math.min(window.innerWidth, window.innerHeight);
  const base = modeInfo?.mode === 'solo' ? smallestSide / 200 : smallestSide / 300;
  S = Math.max(1, Math.round(Math.max(2, Math.min(base, 7)) * dpr));
  ctx.imageSmoothingEnabled = false;
  clampCamera();
}

function clampCamera() {
  if (!bounds) return;
  camera.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.x));
  camera.y = Math.max(bounds.minY, Math.min(bounds.maxY, camera.y));
}

function updateView() {
  const halfWidth = canvas.width / S / 2;
  const halfHeight = canvas.height / S / 2;
  view.left = camera.x - halfWidth;
  view.right = camera.x + halfWidth;
  view.top = camera.y - halfHeight;
  view.bottom = camera.y + halfHeight;
}

function screenToWorld(clientX, clientY) {
  return {
    x: view.left + (clientX * dpr) / S,
    y: view.top + (clientY * dpr) / S,
  };
}

function setupDragging() {
  if (modeInfo.mode !== 'arquipelago') {
    canvas.classList.add('fixo');
  }
  const pointers = { active: null, startX: 0, startY: 0, lastX: 0, lastY: 0, moved: false };

  canvas.addEventListener('pointerdown', (event) => {
    pointers.active = event.pointerId;
    pointers.startX = pointers.lastX = event.clientX;
    pointers.startY = pointers.lastY = event.clientY;
    pointers.moved = false;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('arrastando');
  });

  canvas.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointers.active) return;
    if (Math.hypot(event.clientX - pointers.startX, event.clientY - pointers.startY) > DRAG_THRESHOLD) {
      pointers.moved = true;
    }
    if (modeInfo.mode === 'arquipelago' && pointers.moved) {
      camera.x -= ((event.clientX - pointers.lastX) * dpr) / S;
      camera.y -= ((event.clientY - pointers.lastY) * dpr) / S;
      clampCamera();
    }
    pointers.lastX = event.clientX;
    pointers.lastY = event.clientY;
  });

  const release = (event) => {
    if (event.pointerId !== pointers.active) return;
    pointers.active = null;
    canvas.classList.remove('arrastando');
    if (event.type === 'pointerup' && !pointers.moved) selectIslandAt(event.clientX, event.clientY);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}

function selectIslandAt(clientX, clientY) {
  const world = screenToWorld(clientX, clientY);
  const island = islands.find((candidate) => candidate.contains(world.x, world.y));
  if (island) showCard(island.spec);
  else card.hidden = true;
}

function appendLink(parent, href, label) {
  if (!href) return;
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  parent.append(link);
}

function showCard(spec) {
  card.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = spec.login;
  const status = document.createElement('p');
  status.textContent = `${TEXT.energy[spec.energia]} · ${spec.pushes3d} ${TEXT.pushes} · ★ ${spec.estrelas}`;
  const links = document.createElement('p');
  links.className = 'links';
  appendLink(links, spec.url, TEXT.open);
  if (!spec.principal) appendLink(links, spec.pagesUrl, TEXT.visit);
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = TEXT.close;
  close.addEventListener('click', () => {
    card.hidden = true;
  });
  card.append(title, status, links, close);
  card.hidden = false;
}

function setupHud(data, online) {
  const repoUrl = data.mae.url ?? MOTHER_REPO_URL;
  document.getElementById('modo').textContent = online
    ? modeInfo.mode === 'arquipelago'
      ? TEXT.archipelago
      : TEXT.solo
    : TEXT.offline;
  // No Modo Solo de um fork, os contadores da Mãe não dizem respeito àquela ilha.
  const showsMother = islands[0].spec.principal;
  document.getElementById('estrelas').textContent = islands[0].spec.estrelas;
  document.getElementById('issues').textContent = data.issuesAbertas;
  document.getElementById('forks').textContent = data.totalForks;
  document.getElementById('contador-issues').hidden = !showsMother;
  document.getElementById('contador-forks').hidden = !showsMother;

  const bottleLink = document.getElementById('mandar-garrafa');
  bottleLink.href = `${repoUrl}/issues/new?template=garrafa.yml`;
  bottleLink.textContent = TEXT.bottle;
  const forkLink = document.getElementById('criar-ilha');
  forkLink.href = `${repoUrl}/fork`;
  forkLink.textContent = TEXT.fork;

  const backButton = document.getElementById('voltar');
  if (modeInfo.mode === 'arquipelago' && islands.length > 1) {
    backButton.hidden = false;
    backButton.textContent = TEXT.back;
    backButton.addEventListener('click', () => {
      camera.x = islands[0].x;
      camera.y = islands[0].y;
    });
  }
}

// A garrafa cicla pelas mensagens do catálogo ligadas às Issues abertas.
function setupBottles(island) {
  const messages = island.spec.garrafas;
  if (messages.length === 0) return;
  let index = 0;

  const deliver = () => {
    if (!island.isVisible(view) || readingIsland) return;
    const message = messages[index % messages.length];
    index += 1;
    island.showBottle();
    island.castaway.collectBottle(
      () => {
        island.bottleVisible = false;
      },
      () => {
        balloon.textContent = message[LANGUAGE] ?? message.pt;
        balloon.hidden = false;
        readingIsland = island;
      },
      () => {
        balloon.hidden = true;
        readingIsland = null;
      },
    );
  };

  setTimeout(deliver, 2500);
  setInterval(deliver, BOTTLE_INTERVAL * 1000);
}

// A caixa cai quando este navegador ainda não viu a contagem atual de estrelas.
function setupSupplyDrop(island) {
  const { login, estrelas } = island.spec;
  if (estrelas <= 0) return;
  const key = `git-castaway:estrelas:${login}`;
  let seen = 0;
  try {
    seen = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String(estrelas));
  } catch {
    seen = 0;
  }
  if (estrelas > seen) island.dropCrate();
}

function positionBalloon() {
  if (!readingIsland) return;
  balloon.style.visibility = readingIsland.isVisible(view) ? 'visible' : 'hidden';
  const position = readingIsland.castawayWorldPosition();
  const x = ((position.x - view.left) * S) / dpr;
  const y = ((position.y - 24 - view.top) * S) / dpr;
  const margin = Math.min(window.innerWidth / 2 - 16, balloon.offsetWidth / 2 + 8);
  const clampedX = Math.max(margin, Math.min(window.innerWidth - margin, x));
  const clampedY = Math.max(balloon.offsetHeight + 8, y);
  balloon.style.transform = `translate(${Math.round(clampedX)}px, ${Math.round(clampedY)}px) translate(-50%, -100%)`;
}

let previousFrame = performance.now();

function frame(now) {
  const dt = Math.min((now - previousFrame) / 1000, 0.1);
  previousFrame = now;
  updateView();
  drawOcean(ctx, S, view, now / 1000, canvas.width, canvas.height);

  const visible = [];
  for (const island of islands) {
    if (island.isVisible(view)) {
      island.loadAvatar();
      island.update(dt);
      visible.push(island);
    } else if (island === readingIsland) {
      island.update(dt);
    }
  }
  visible.sort((a, b) => a.y - b.y);

  const originShiftX = Math.round(view.left * S) / S;
  const originShiftY = Math.round(view.top * S) / S;
  for (const island of visible) {
    island.draw(ctx, S, island.x - originShiftX, island.y - originShiftY);
  }

  positionBalloon();
  requestAnimationFrame(frame);
}

async function start() {
  modeInfo = resolveMode(window.location);
  const { data, online } = await loadData(window.location);
  const specs = buildIslandSpecs(data, modeInfo);
  islands = specs.map((spec, index) => {
    const position = islandPosition(index);
    return new Island(spec, position.x, position.y);
  });
  bounds = worldBounds(islands);
  camera.x = islands[0].x;
  camera.y = islands[0].y - 8;

  try {
    await document.fonts.load('16px "VT323"');
  } catch {
    // A fonte é opcional: sem ela, os nomes usam monospace.
  }

  resize();
  window.addEventListener('resize', resize);
  updateView();
  setupDragging();
  setupHud(data, online);
  setupBottles(islands[0]);
  setupSupplyDrop(islands[0]);
  requestAnimationFrame(frame);
}

start();
