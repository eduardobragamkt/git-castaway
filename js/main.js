import { MOTHER_REPO_URL } from './config.js';
import { activeBottles, canReadBottle } from './bottles.js';
import { buildIslandSpecs, devOptions, loadData, profileUrl, resolveMode } from './data.js';
import { Island } from './island.js';
import { islandPosition, worldBounds } from './layout.js';
import { drawOcean } from './ocean.js';
import { ACTIVITIES } from './scene/activities.js';
import { Scene } from './scene/scene.js';
import { currentHour, paletteAt } from './time.js';
import { STAR_UPGRADES, nextUpgrade } from './upgrades.js';
import { cameraAfterZoom, clampScale, clampSceneCamera, fitScale, scaleLimits, stepScale, zoomPercent } from './zoom.js';

const LANGUAGE = (navigator.language ?? 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
const TEXT = {
  pt: {
    archipelago: 'Modo Arquipélago: arraste para navegar',
    solo: 'Modo Solo',
    islandOf: (login) => `Ilha de ${login}`,
    offline: 'Sem dados do GitHub no momento',
    back: 'Voltar à ilha principal',
    map: 'Ver mapa',
    bottle: 'Mandar garrafa',
    fork: 'Criar minha ilha',
    profile: 'Ver perfil no GitHub',
    visit: 'Visitar página da ilha',
    enter: 'Entrar na ilha',
    commits: (count) => `${count} ${count === 1 ? 'commit público' : 'commits públicos'} em 3 dias`,
    next: (name, stars) => `Próxima melhoria: ${name} (★ ${stars})`,
    complete: 'Todas as melhorias conquistadas',
    energy: { dormindo: 'Dormindo', pescando: 'Pescando de boa', trabalhando: 'A todo vapor' },
    close: 'Fechar',
    zoomIn: 'Aproximar',
    zoomOut: 'Afastar',
    zoomFit: 'Ajustar à tela',
    zoomMenu: 'Zoom da tela',
  },
  en: {
    archipelago: 'Archipelago mode: drag to explore',
    solo: 'Solo mode',
    islandOf: (login) => `${login}'s island`,
    offline: 'GitHub data is unavailable right now',
    back: 'Back to main island',
    map: 'View map',
    bottle: 'Send a bottle',
    fork: 'Create my island',
    profile: 'View GitHub profile',
    visit: 'Visit island page',
    enter: 'Enter island',
    commits: (count) => `${count} public ${count === 1 ? 'commit' : 'commits'} in 3 days`,
    next: (name, stars) => `Next upgrade: ${name} (★ ${stars})`,
    complete: 'All upgrades unlocked',
    energy: { dormindo: 'Sleeping', pescando: 'Fishing', trabalhando: 'Full steam ahead' },
    close: 'Close',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit to screen',
    zoomMenu: 'Screen zoom',
  },
}[LANGUAGE];

const BOTTLE_CHECK_MS = 5000;
const BOTTLE_READ_KEY = 'git-castaway:ultima-leitura';
const DRAG_THRESHOLD = 5;
const IDLE_AFTER_MS = 5000;
const ZOOM_MENU_SPACE = 80;
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const canvas = document.getElementById('mar');
const ctx = canvas.getContext('2d');
const balloon = document.getElementById('balao');
const card = document.getElementById('cartao');
const backButton = document.getElementById('voltar');
const zoomLabel = document.getElementById('zoom-valor');
const zoomInButton = document.getElementById('zoom-mais');
const zoomOutButton = document.getElementById('zoom-menos');
const zoomFitButton = document.getElementById('zoom-ajustar');

const dev = devOptions(window.location);
const hourNow = () => dev.hour ?? currentHour();

const cameras = { map: { x: 0, y: 0 }, scene: { x: 0, y: 0 } };
const zoomOverride = { map: null, scene: null };
const mapView = { left: 0, right: 0, top: 0, bottom: 0 };

let appData = null;
let online = true;
let modeInfo = null;
let dpr = 1;
let activeView = 'map';
let islands = [];
let bounds = null;
let scene = null;
let readingAnchor = null;
let cardAnchor = null;
let transition = null;
let idleTimer = null;

function fit() {
  return fitScale(activeView, window.innerWidth, window.innerHeight, dpr);
}

function scale() {
  const limits = scaleLimits(fit());
  return clampScale(zoomOverride[activeView] ?? fit(), limits);
}

function clampCamera() {
  const camera = cameras[activeView];
  if (activeView === 'map') {
    if (!bounds) return;
    camera.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.x));
    camera.y = Math.max(bounds.minY, Math.min(bounds.maxY, camera.y));
    return;
  }
  const S = scale();
  Object.assign(camera, clampSceneCamera(camera, canvas.width / S, canvas.height / S));
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.imageSmoothingEnabled = false;
  clampCamera();
  updateZoomMenu();
}

function updateMapView() {
  const S = scale();
  const halfWidth = canvas.width / S / 2;
  const halfHeight = canvas.height / S / 2;
  const { x, y } = cameras.map;
  mapView.left = x - halfWidth;
  mapView.right = x + halfWidth;
  mapView.top = y - halfHeight;
  mapView.bottom = y + halfHeight;
}

function viewOrigin() {
  return activeView === 'scene' && scene ? scene.view : mapView;
}

function screenToWorld(clientX, clientY) {
  const origin = viewOrigin();
  const S = scale();
  return { x: origin.left + (clientX * dpr) / S, y: origin.top + (clientY * dpr) / S };
}

function worldToScreen(point) {
  const origin = viewOrigin();
  const S = scale();
  return { x: ((point.x - origin.left) * S) / dpr, y: ((point.y - origin.top) * S) / dpr };
}

// Zoom

function setScale(newScale, pointer = { x: canvas.width / 2, y: canvas.height / 2 }) {
  const oldScale = scale();
  const limits = scaleLimits(fit());
  const next = clampScale(newScale, limits);
  if (next === oldScale) return;
  zoomOverride[activeView] = next;
  cameras[activeView] = cameraAfterZoom(
    cameras[activeView],
    pointer,
    { width: canvas.width, height: canvas.height },
    oldScale,
    next,
  );
  clampCamera();
  updateZoomMenu();
}

function zoomBy(direction, pointer) {
  setScale(stepScale(scale(), direction, scaleLimits(fit())), pointer);
}

function zoomToFit() {
  zoomOverride[activeView] = null;
  if (activeView === 'scene') cameras.scene = { x: 0, y: 0 };
  clampCamera();
  updateZoomMenu();
}

function updateZoomMenu() {
  const S = scale();
  const limits = scaleLimits(fit());
  zoomLabel.textContent = `${zoomPercent(S, fit())}%`;
  zoomInButton.disabled = S >= limits.max;
  zoomOutButton.disabled = S <= limits.min;
  zoomFitButton.disabled = zoomOverride[activeView] === null || S === fit();
}

function setupZoomMenu() {
  document.getElementById('zoom').setAttribute('aria-label', TEXT.zoomMenu);
  zoomInButton.setAttribute('aria-label', TEXT.zoomIn);
  zoomInButton.title = TEXT.zoomIn;
  zoomOutButton.setAttribute('aria-label', TEXT.zoomOut);
  zoomOutButton.title = TEXT.zoomOut;
  zoomFitButton.setAttribute('aria-label', TEXT.zoomFit);
  zoomFitButton.title = TEXT.zoomFit;
  zoomInButton.addEventListener('click', () => zoomBy(1));
  zoomOutButton.addEventListener('click', () => zoomBy(-1));
  zoomFitButton.addEventListener('click', zoomToFit);

  let lastWheel = 0;
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel < 70 || event.deltaY === 0) return;
      lastWheel = now;
      zoomBy(event.deltaY < 0 ? 1 : -1, { x: event.clientX * dpr, y: event.clientY * dpr });
    },
    { passive: false },
  );
}

// Arrastar, pinçar e clicar

function setupPointer() {
  const pointers = new Map();
  let moved = false;
  let startX = 0;
  let startY = 0;
  let pinch = null;

  const midpoint = () => {
    const [a, b] = [...pointers.values()];
    return { x: ((a.x + b.x) / 2) * dpr, y: ((a.y + b.y) / 2) * dpr };
  };
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      canvas.classList.add('arrastando');
    }
    if (pointers.size === 2) {
      moved = true;
      pinch = { distance: distance(), scale: scale() };
    }
  });

  canvas.addEventListener('pointermove', (event) => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;

    if (pointers.size === 2 && pinch) {
      setScale(pinch.scale * (distance() / pinch.distance), midpoint());
      return;
    }
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > DRAG_THRESHOLD) moved = true;
    if (moved) {
      const S = scale();
      cameras[activeView].x -= (dx * dpr) / S;
      cameras[activeView].y -= (dy * dpr) / S;
      clampCamera();
    }
  });

  const release = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size > 0) return;
    canvas.classList.remove('arrastando');
    if (event.type === 'pointerup' && !moved) handleClick(event.clientX, event.clientY);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}

function handleClick(clientX, clientY) {
  if (transition) return;
  const world = screenToWorld(clientX, clientY);
  const tolerance = (22 * dpr) / scale();

  if (activeView === 'scene') {
    if (scene.hitsCastaway(world.x, world.y, tolerance)) {
      showCard(scene.spec, () => scene.anchor());
    } else {
      closeCard();
    }
    return;
  }

  const visible = islands.filter((island) => island.isVisible(mapView));
  const character = visible.find((island) => island.hitsCastaway(world.x, world.y, tolerance));
  if (character) {
    showCard(character.spec, () => {
      const { x, y } = character.castawayWorldPosition();
      return { x, y: y - 22 };
    }, () => enterIsland(character.spec, clientX, clientY));
    return;
  }
  const island = visible.find((candidate) => candidate.contains(world.x, world.y));
  if (island) {
    closeCard();
    enterIsland(island.spec, clientX, clientY);
    return;
  }
  closeCard();
}

// Pop-up do personagem

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkButton(href, label, className) {
  if (!href) return null;
  const link = element('a', className, label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function showCard(spec, anchorFn, onEnter = null) {
  card.replaceChildren();
  card.dataset.energia = spec.energia;

  const close = element('button', 'cartao-fechar', '×');
  close.type = 'button';
  close.setAttribute('aria-label', TEXT.close);
  close.addEventListener('click', closeCard);

  const header = element('header', 'cartao-topo');
  const portrait = element('div', 'cartao-retrato');
  if (spec.avatar) {
    const image = document.createElement('img');
    image.alt = '';
    image.width = 48;
    image.height = 48;
    image.src = `${spec.avatar}${spec.avatar.includes('?') ? '&' : '?'}s=96`;
    image.addEventListener('error', () => image.remove());
    portrait.append(image);
  }
  const identity = element('div', 'cartao-nome');
  const title = element('h2', null, spec.login);
  title.id = 'cartao-titulo';
  identity.append(title, element('p', 'cartao-humor', TEXT.energy[spec.energia]));
  header.append(portrait, identity);

  const meter = element('div', 'cartao-energia');
  meter.setAttribute('role', 'img');
  meter.setAttribute('aria-label', TEXT.commits(spec.commits3d));
  for (let i = 0; i < 5; i += 1) {
    meter.append(element('span', i < spec.commits3d ? 'cheio' : null));
  }
  const activity = element('p', 'cartao-linha', TEXT.commits(spec.commits3d));

  const upcoming = nextUpgrade(spec.estrelas);
  const previousStars = upcoming
    ? [...STAR_UPGRADES].reverse().find((upgrade) => upgrade.stars <= spec.estrelas)?.stars ?? 0
    : 0;
  const stars = element('p', 'cartao-linha cartao-estrelas', `★ ${spec.estrelas}`);
  const goal = element(
    'p',
    'cartao-linha',
    upcoming ? TEXT.next(upcoming[LANGUAGE], upcoming.stars) : TEXT.complete,
  );
  const progress = element('div', 'cartao-progresso');
  const bar = element('span');
  const share = upcoming ? (spec.estrelas - previousStars) / (upcoming.stars - previousStars) : 1;
  bar.style.width = `${Math.round(share * 100)}%`;
  progress.append(bar);

  const actions = element('div', 'cartao-acoes');
  const profile = linkButton(profileUrl(spec.login), TEXT.profile, 'botao-principal');
  if (profile) actions.append(profile);
  if (onEnter) {
    const enter = element('button', 'botao-secundario', TEXT.enter);
    enter.type = 'button';
    enter.addEventListener('click', () => {
      closeCard();
      onEnter();
    });
    actions.append(enter);
  }
  if (!spec.principal) {
    const visit = linkButton(spec.pagesUrl, TEXT.visit, 'botao-secundario');
    if (visit) actions.append(visit);
  }

  card.append(close, header, meter, activity, stars, goal, progress, actions);
  card.hidden = false;
  cardAnchor = anchorFn;
  document.body.classList.remove('ocioso');
  positionFloating(card, cardAnchor(), true);
  card.focus({ preventScroll: true });
}

function closeCard() {
  card.hidden = true;
  cardAnchor = null;
}

function positionFloating(node, worldPoint, isCard = false) {
  if (isCard && window.matchMedia('(max-width: 560px)').matches) {
    node.style.transform = '';
    return;
  }
  const point = worldToScreen(worldPoint);
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  const rightMargin = isCard ? ZOOM_MENU_SPACE : 16;
  const x = Math.max(16, Math.min(window.innerWidth - width - rightMargin, point.x - width / 2));
  const y = Math.max(16, point.y - height - 12);
  node.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  node.style.setProperty('--seta-x', `${Math.round(Math.max(12, Math.min(width - 20, point.x - x - 5)))}px`);
  node.classList.toggle('sem-seta', point.y - height - 12 < 16);
}

// Navegação entre mapa e cena

function buildScene(spec) {
  if (scene?.spec.login === spec.login) return scene;
  return new Scene(spec, {
    hourFn: hourNow,
    distantIslets: appData.totalForks,
    fixedActivity: dev.activity && ACTIVITIES[dev.activity] ? dev.activity : null,
    fixedVariant: dev.variant ?? null,
  });
}

function stopReading() {
  balloon.hidden = true;
  readingAnchor = null;
  bottleHeld = false;
}

function switchView(name, spec = null) {
  stopReading();
  closeCard();
  activeView = name;
  if (name === 'scene') {
    scene = buildScene(spec);
    cameras.scene = { x: 0, y: 0 };
    if (spec.principal) window.setTimeout(deliverBottle, 2500);
  }
  clampCamera();
  updateZoomMenu();
  updateHud();
}

function startTransition(clientX, clientY, midpoint) {
  if (REDUCED_MOTION) {
    midpoint();
    return;
  }
  transition = { time: 0, duration: 0.8, x: clientX * dpr, y: clientY * dpr, midpoint, fired: false };
}

function enterIsland(spec, clientX, clientY) {
  startTransition(clientX, clientY, () => switchView('scene', spec));
}

function drawTransition(dt) {
  if (!transition) return;
  transition.time += dt;
  const progress = transition.time / transition.duration;
  if (!transition.fired && progress >= 0.5) {
    transition.fired = true;
    transition.midpoint();
    transition.x = canvas.width / 2;
    transition.y = canvas.height / 2;
  }
  if (progress >= 1) {
    transition = null;
    return;
  }
  const opening = progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2;
  const reach = Math.hypot(canvas.width, canvas.height);
  ctx.fillStyle = '#05060f';
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.arc(transition.x, transition.y, Math.max(0, opening * reach), 0, Math.PI * 2);
  ctx.fill('evenodd');
}

// Painéis

function updateHud() {
  const spec = activeView === 'scene' && scene ? scene.spec : islands[0].spec;
  let label = TEXT.offline;
  if (online) {
    if (modeInfo.mode === 'solo') label = TEXT.solo;
    else label = activeView === 'map' ? TEXT.archipelago : TEXT.islandOf(spec.login);
  }
  document.getElementById('modo').textContent = label;

  const showsMother = spec.principal;
  document.getElementById('estrelas').textContent = spec.estrelas;
  document.getElementById('issues').textContent = appData.issuesAbertas;
  document.getElementById('forks').textContent = appData.totalForks;
  document.getElementById('contador-issues').hidden = !showsMother;
  document.getElementById('contador-forks').hidden = !showsMother;

  if (modeInfo.mode !== 'arquipelago') {
    backButton.hidden = true;
  } else if (activeView === 'scene') {
    backButton.hidden = false;
    backButton.textContent = TEXT.map;
  } else {
    backButton.hidden = islands.length <= 1;
    backButton.textContent = TEXT.back;
  }
}

function setupHud() {
  const repoUrl = appData.mae.url ?? MOTHER_REPO_URL;
  const bottleLink = document.getElementById('mandar-garrafa');
  bottleLink.href = `${repoUrl}/issues/new?template=garrafa.yml`;
  bottleLink.textContent = TEXT.bottle;
  const forkLink = document.getElementById('criar-ilha');
  forkLink.href = `${repoUrl}/fork`;
  forkLink.textContent = TEXT.fork;

  backButton.addEventListener('click', () => {
    if (activeView === 'scene') {
      startTransition(window.innerWidth / 2, window.innerHeight / 2, () => switchView('map'));
    } else {
      cameras.map = { x: islands[0].x, y: islands[0].y };
    }
  });
  updateHud();
}

// Painéis somem quando ninguém mexe no mouse, deixando só o quadro vivo.
function setupIdle() {
  const wake = () => {
    document.body.classList.remove('ocioso');
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (card.hidden) document.body.classList.add('ocioso');
    }, IDLE_AFTER_MS);
  };
  ['pointermove', 'pointerdown', 'keydown', 'focusin'].forEach((type) => window.addEventListener(type, wake));
  wake();
}

function setupKeyboard() {
  window.addEventListener('keydown', (event) => {
    if (event.key === '+' || event.key === '=') zoomBy(1);
    else if (event.key === '-') zoomBy(-1);
    else if (event.key === '0') zoomToFit();
    else if (event.key === 'Escape') {
      if (!card.hidden) closeCard();
      else if (activeView === 'scene' && modeInfo.mode === 'arquipelago') backButton.click();
    }
  });
}

// Garrafas: ficam na praia por 30 minutos desde a abertura da Issue. O náufrago lê uma
// vez e volta à rotina, e o intervalo vale mesmo se a página for recarregada.

let bottleIndex = 0;
let bottleHeld = false;
let lastBottleRead = readLastBottleTime();

function readLastBottleTime() {
  try {
    return Number(localStorage.getItem(BOTTLE_READ_KEY));
  } catch {
    return NaN;
  }
}

function markBottleRead() {
  lastBottleRead = Date.now();
  try {
    localStorage.setItem(BOTTLE_READ_KEY, String(lastBottleRead));
  } catch {
    // Sem armazenamento, o intervalo vale só enquanto a página estiver aberta.
  }
}

function deliverBottle() {
  const messages = activeBottles(appData.garrafas);
  if (messages.length === 0 || dev.activity || readingAnchor || bottleHeld || transition) return;
  if (!canReadBottle(lastBottleRead)) return;

  const message = messages[bottleIndex % messages.length];
  const viewAtStart = activeView;
  const pickUp = () => {
    bottleHeld = true;
  };
  const openBalloon = (anchorFn) => {
    if (activeView !== viewAtStart) return;
    balloon.textContent = message[LANGUAGE] ?? message.pt;
    balloon.hidden = false;
    readingAnchor = anchorFn;
  };

  if (activeView === 'scene') {
    if (!scene.spec.principal) return;
    const current = scene;
    bottleIndex += 1;
    markBottleRead();
    current.collectBottle(pickUp, () => openBalloon(() => current.anchor()), stopReading);
    return;
  }

  const main = islands[0];
  if (!main.spec.principal || !main.isVisible(mapView)) return;
  bottleIndex += 1;
  markBottleRead();
  main.castaway.collectBottle(
    pickUp,
    () => {
      const { x, y } = main.castawayWorldPosition();
      openBalloon(() => ({ x, y: y - 24 }));
    },
    stopReading,
  );
}

// A garrafa continua na areia entre as leituras e some sozinha ao fim da validade.
function syncBottleOnBeach() {
  const show = !dev.activity && !bottleHeld && activeBottles(appData.garrafas).length > 0;
  if (islands[0].spec.principal) islands[0].bottleVisible = show;
  if (scene?.spec.principal) scene.bottleVisible = show;
}

// A caixa cai quando este navegador ainda não viu a contagem atual de estrelas.
function starsAreNew(spec) {
  if (spec.estrelas <= 0) return false;
  const key = `git-castaway:estrelas:${spec.login}`;
  try {
    const seen = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String(spec.estrelas));
    return spec.estrelas > seen;
  } catch {
    return false;
  }
}

// Laço principal

let previousFrame = performance.now();

function drawMap(now, dt) {
  updateMapView();
  const S = scale();
  drawOcean(ctx, S, mapView, now / 1000, canvas.width, canvas.height);
  const visible = islands.filter((island) => island.isVisible(mapView));
  visible.forEach((island) => {
    island.loadAvatar();
    island.update(dt);
  });
  visible.sort((a, b) => a.y - b.y);
  const shiftX = Math.round(mapView.left * S) / S;
  const shiftY = Math.round(mapView.top * S) / S;
  visible.forEach((island) => island.draw(ctx, S, island.x - shiftX, island.y - shiftY));

  const { ambient } = paletteAt(hourNow());
  if (ambient !== '#ffffff') {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = ambient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function frame(now) {
  const dt = Math.min((now - previousFrame) / 1000, 0.1);
  previousFrame = now;
  ctx.imageSmoothingEnabled = false;
  syncBottleOnBeach();

  if (activeView === 'scene') {
    scene.update(dt);
    scene.render(ctx, scale(), cameras.scene, canvas.width, canvas.height, now / 1000, dt);
  } else {
    drawMap(now, dt);
  }

  drawTransition(dt);
  if (readingAnchor) {
    const offMap = activeView === 'map' && !islands[0].isVisible(mapView);
    balloon.style.visibility = offMap ? 'hidden' : 'visible';
    positionFloating(balloon, readingAnchor());
  }
  if (cardAnchor && !card.hidden) positionFloating(card, cardAnchor(), true);
  requestAnimationFrame(frame);
}

async function start() {
  modeInfo = resolveMode(window.location);
  const loaded = await loadData(window.location);
  appData = loaded.data;
  online = loaded.online;

  islands = buildIslandSpecs(appData, modeInfo).map((spec, index) => {
    const position = islandPosition(index);
    return new Island(spec, position.x, position.y);
  });
  bounds = worldBounds(islands);
  cameras.map = { x: islands[0].x, y: islands[0].y - 8 };

  try {
    await document.fonts.load('16px "VT323"');
  } catch {
    // A fonte é opcional: sem ela, os textos usam monospace.
  }

  const onlyOneIsland = modeInfo.mode === 'solo' || islands.length === 1;
  const startInScene = dev.view === 'cena' || (dev.view !== 'mapa' && onlyOneIsland);
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  setupZoomMenu();
  setupHud();
  switchView(startInScene ? 'scene' : 'map', startInScene ? islands[0].spec : null);
  updateMapView();
  resize();
  window.addEventListener('resize', resize);
  setupPointer();
  setupKeyboard();
  setupIdle();

  if (!dev.activity && starsAreNew(islands[0].spec)) {
    if (startInScene) scene.dropCrate();
    else islands[0].dropCrate();
  }
  window.setInterval(deliverBottle, BOTTLE_CHECK_MS);
  if (!startInScene) window.setTimeout(deliverBottle, 2500);
  requestAnimationFrame(frame);
}

start();
