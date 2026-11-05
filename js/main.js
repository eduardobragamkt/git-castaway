import { MOTHER_REPO_URL } from './config.js';
import { daysOnIsland, pendingMilestones } from './calendar.js';
import { buildIslandSpecs, devOptions, findIslandSpec, forkRedirectUrl, loadData, profileUrl, requestedIsland } from './data.js';
import { LANGUAGES, TEXTS, initialLanguage } from './i18n.js';
import {
  INTRO,
  canSkipIntro,
  curtainOpacity,
  easeInOut,
  introLines,
  introTake,
  shouldPlayIntro,
  takeProgress,
  typedText,
} from './intro.js';
import { Island } from './island.js';
import { islandPosition, worldBounds } from './layout.js';
import { drawOcean } from './ocean.js';
import { ACTIVITIES, introBottle } from './scene/activities.js';
import { Scene } from './scene/scene.js';
import { currentHour, paletteAt } from './time.js';
import { STAR_UPGRADES, nextUpgrade } from './upgrades.js';
import { cameraAfterZoom, clampScale, clampSceneCamera, fitScale, scaleLimits, stepScale, zoomPercent } from './zoom.js';

const LANGUAGE_KEY = 'git-castaway:idioma';

function storedLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

let LANGUAGE = initialLanguage(storedLanguage());
let TEXT = TEXTS[LANGUAGE];

const MILESTONE_CHECK_MS = 5000;
const MILESTONES_KEY = 'git-castaway:marcos';
const INTRO_SEEN_KEY = 'git-castaway:abertura-vista';
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
const fullscreenButton = document.getElementById('tela-cheia');
const fullscreenIcon = document.getElementById('icone-tela-cheia');
const forkButton = document.getElementById('criar-ilha');
const readMeButton = document.getElementById('leia-me');
const modalBackdrop = document.getElementById('fundo-modal');
const modal = document.getElementById('modal');
const replayButton = document.getElementById('rever-abertura');
const introOverlay = document.getElementById('abertura');
const introCurtain = document.getElementById('abertura-cortina');
const introTerminal = document.getElementById('abertura-terminal');
const introSkip = document.getElementById('abertura-pular');
const FULLSCREEN_ICON = 'M1 1h5v2H3v3H1V1zm9 0h5v5h-2V3h-3V1zM1 10h2v3h3v2H1v-5zm12 0h2v5h-5v-2h3v-3z';
const EXIT_FULLSCREEN_ICON = 'M4 1h2v5H1V4h3V1zm6 0h2v3h3v2h-5V1zM1 10h5v5H4v-3H1v-2zm9 0h5v2h-3v3h-2v-5z';

const dev = devOptions(window.location);
const hourNow = () => dev.hour ?? currentHour(dev.date ?? new Date());
const dateNow = () => dev.date ?? new Date();

const cameras = { map: { x: 0, y: 0 }, scene: { x: 0, y: 0 } };
const zoomOverride = { map: null, scene: null };
const mapView = { left: 0, right: 0, top: 0, bottom: 0 };

let appData = null;
let online = true;
let dpr = 1;
let activeView = 'map';
let islands = [];
let bounds = null;
let scene = null;
let readingAnchor = null;
let balloonText = null;
let openModal = null;
let modalTrigger = null;
let cardAnchor = null;
let transition = null;
let idleTimer = null;
let wakePanels = () => {};
let intro = null;
let afterIntro = null;

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

  const dayCount = daysOnIsland(spec.criadoEm, dateNow());
  const days = dayCount ? element('p', 'cartao-linha', TEXT.days(dayCount)) : null;

  card.append(close, header, meter, activity, ...(days ? [days] : []), stars, goal, progress, actions);
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
    dateFn: dateNow,
    weatherOverride: dev.weather ?? null,
    tideOverride: dev.tide ?? null,
    onBottleOpen: (message, source) => {
      if (activeView === 'scene' && scene === source) {
        openBalloon(() => message[LANGUAGE], () => source.anchor());
      }
    },
    onBottleClose: (source) => {
      if (scene === source) stopReading();
    },
  });
}

function stopReading() {
  balloon.hidden = true;
  readingAnchor = null;
  balloonText = null;
}

function openBalloon(textFn, anchorFn) {
  balloonText = textFn;
  balloon.textContent = textFn();
  balloon.hidden = false;
  readingAnchor = anchorFn;
}

// O endereço de cada ilha é `?ilha=login`, dentro da única URL pública.
function syncIslandUrl(spec) {
  const url = new URL(window.location.href);
  if (spec && !spec.principal) url.searchParams.set('ilha', spec.login);
  else url.searchParams.delete('ilha');
  window.history.replaceState(null, '', url);
}

function switchView(name, spec = null) {
  stopReading();
  closeCard();
  activeView = name;
  if (name === 'scene') {
    scene = buildScene(spec);
    cameras.scene = { x: 0, y: 0 };
  }
  syncIslandUrl(name === 'scene' ? spec : null);
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
  if (online) label = activeView === 'map' ? TEXT.archipelago : TEXT.islandOf(spec.login);
  document.getElementById('modo').textContent = label;

  document.getElementById('estrelas').textContent = spec.estrelas;
  document.getElementById('forks').textContent = appData.totalForks;
  document.getElementById('contador-forks').hidden = !spec.principal;

  if (activeView === 'scene') {
    backButton.hidden = false;
    backButton.textContent = TEXT.map;
  } else {
    backButton.hidden = islands.length <= 1;
    backButton.textContent = TEXT.back;
  }
}

function setupHud() {
  forkButton.addEventListener('click', () => showModal('fork', forkButton));
  readMeButton.addEventListener('click', () => showModal('about', readMeButton));
  replayButton.hidden = REDUCED_MOTION;
  replayButton.addEventListener('click', startIntro);
  backButton.addEventListener('click', () => {
    if (activeView === 'scene') {
      startTransition(window.innerWidth / 2, window.innerHeight / 2, () => switchView('map'));
    } else {
      cameras.map = { x: islands[0].x, y: islands[0].y };
    }
  });
  modalBackdrop.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) closeModal();
  });
  modal.addEventListener('keydown', keepFocusInModal);
  updateHud();
}

// Idiomas: inglês por padrão, com a escolha guardada no navegador.

function renderLanguageSwitches() {
  document.querySelectorAll('[data-idioma]').forEach((holder) => {
    holder.setAttribute('role', 'group');
    holder.setAttribute('aria-label', TEXT.languageMenu);
    holder.replaceChildren(
      ...LANGUAGES.map((code) => {
        const button = element('button', null, code.toUpperCase());
        button.type = 'button';
        button.setAttribute('aria-pressed', String(code === LANGUAGE));
        button.addEventListener('click', () => setLanguage(code));
        return button;
      }),
    );
  });
}

function applyLanguage() {
  document.documentElement.lang = LANGUAGE === 'pt' ? 'pt-BR' : 'en';
  canvas.setAttribute('aria-label', TEXT.canvasLabel);
  forkButton.textContent = TEXT.fork;
  readMeButton.textContent = TEXT.readMe;
  replayButton.textContent = TEXT.introReplay;
  replayButton.setAttribute('aria-label', TEXT.introReplayLabel);
  replayButton.title = TEXT.introReplayLabel;
  introOverlay.setAttribute('aria-label', TEXT.introLabel);
  introSkip.textContent = TEXT.introSkip;
  document.getElementById('zoom').setAttribute('aria-label', TEXT.zoomMenu);
  for (const [button, label] of [
    [zoomInButton, TEXT.zoomIn],
    [zoomOutButton, TEXT.zoomOut],
    [zoomFitButton, TEXT.zoomFit],
  ]) {
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  updateFullscreenButton();
  updateHud();
  closeCard();
  if (balloonText) balloon.textContent = balloonText();
  if (openModal) renderModal();
  renderLanguageSwitches();
}

function setLanguage(code) {
  LANGUAGE = code;
  TEXT = TEXTS[code];
  try {
    localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // Sem armazenamento, a escolha vale só enquanto a página estiver aberta.
  }
  applyLanguage();
}

// Pop-ups "Criar minha ilha" e "Leia-me"

function renderModal() {
  const top = element('div', 'modal-topo');
  const title = element('h2', null, openModal === 'fork' ? TEXT.forkTitle : TEXT.aboutTitle);
  title.id = 'modal-titulo';
  const language = element('div', 'idioma');
  language.dataset.idioma = '';
  top.append(title, language);

  const close = element('button', 'cartao-fechar', '×');
  close.type = 'button';
  close.setAttribute('aria-label', TEXT.close);
  close.addEventListener('click', closeModal);

  const content = [];
  if (openModal === 'fork') {
    const steps = element('ol');
    TEXT.forkSteps.forEach((step) => steps.append(element('li', null, step)));
    const repoUrl = appData.mae.url ?? MOTHER_REPO_URL;
    const action = linkButton(`${repoUrl}/fork`, TEXT.forkAction, 'botao-principal');
    action.addEventListener('click', closeModal);
    content.push(steps, action);
  } else {
    TEXT.aboutParagraphs.forEach((paragraph) => content.push(element('p', null, paragraph)));
    content.push(element('p', 'modal-nota', TEXT.aboutNote));
  }
  modal.replaceChildren(close, top, ...content);
  renderLanguageSwitches();
}

function showModal(kind, trigger) {
  closeCard();
  openModal = kind;
  modalTrigger = trigger;
  modalBackdrop.hidden = false;
  document.body.classList.remove('ocioso');
  renderModal();
  modal.scrollTop = 0;
  modal.focus({ preventScroll: true });
}

function closeModal() {
  openModal = null;
  modalBackdrop.hidden = true;
  modalTrigger?.focus({ preventScroll: true });
  modalTrigger = null;
}

function keepFocusInModal(event) {
  if (event.key !== 'Tab') return;
  const focusable = [...modal.querySelectorAll('a[href], button')];
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// Tela cheia. Navegadores sem esse recurso, como o do iPhone, não mostram o botão.

function fullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function toggleFullscreen() {
  if (fullscreenElement()) {
    (document.exitFullscreen ?? document.webkitExitFullscreen).call(document);
    return;
  }
  const root = document.documentElement;
  (root.requestFullscreen ?? root.webkitRequestFullscreen).call(root);
}

function updateFullscreenButton() {
  const active = Boolean(fullscreenElement());
  const label = active ? TEXT.fullscreenExit : TEXT.fullscreenEnter;
  fullscreenButton.setAttribute('aria-label', label);
  fullscreenButton.title = label;
  fullscreenIcon.setAttribute('d', active ? EXIT_FULLSCREEN_ICON : FULLSCREEN_ICON);
}

function setupFullscreen() {
  const root = document.documentElement;
  const supported =
    Boolean(root.requestFullscreen ?? root.webkitRequestFullscreen) &&
    Boolean(document.fullscreenEnabled ?? document.webkitFullscreenEnabled);
  fullscreenButton.hidden = !supported;
  if (!supported) return;
  fullscreenButton.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
}

// Abertura: cinco tomadas com o próprio jogo, sempre com dados e céu reais.

function startIntro() {
  // Sem foco no botão Intro, a barra de espaço pula a abertura em vez de reiniciá-la.
  document.activeElement?.blur?.();
  closeCard();
  stopReading();
  const main = islands[0].spec;
  const days = daysOnIsland(main.criadoEm, dateNow()) ?? 1;
  scene = buildScene(main);
  scene.showDistantLight = true;
  const lines = introLines(days, appData.totalForks + 1, TEXT);
  introTerminal.replaceChildren(
    ...lines.map((line) => {
      const row = element('div', 'abertura-linha');
      row.hidden = true;
      line.row = row;
      return row;
    }),
  );
  intro = { time: 0, take: null, lines };
  introOverlay.hidden = false;
  document.body.classList.add('em-abertura');
  zoomOverride.scene = null;
  activeView = 'scene';
  cameras.scene = { x: 290, y: -8 };
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // Sem armazenamento, a abertura pode aparecer de novo na próxima visita.
  }
}

function renderIntroTerminal() {
  const { time, lines } = intro;
  const current = lines.reduce((last, line, index) => (time >= line.at ? index : last), -1);
  lines.forEach((line, index) => {
    line.row.hidden = index > current;
    line.row.textContent = typedText(line, time);
    line.row.classList.toggle('atual', index === current);
    line.row.classList.toggle('anterior', index < current);
  });
  introCurtain.style.opacity = String(curtainOpacity(time));
}

function updateIntro(dt) {
  intro.time += dt;
  const { time } = intro;
  if (time >= INTRO.end) {
    finishIntro(false);
    return;
  }
  const take = introTake(time);
  const changed = take !== intro.take;
  intro.take = take;
  const mapLimits = scaleLimits(fitScale('map', window.innerWidth, window.innerHeight, dpr));
  const mapFit = fitScale('map', window.innerWidth, window.innerHeight, dpr);
  const sceneFit = fitScale('scene', window.innerWidth, window.innerHeight, dpr);

  if (take === 'terminal' || take === 'sea') {
    activeView = 'scene';
    const u = easeInOut(takeProgress(time, 0, INTRO.bottle));
    cameras.scene = { x: 300 - u * 110, y: -10 };
    zoomOverride.scene = sceneFit;
  } else if (take === 'bottle') {
    if (changed) {
      scene.showDistantLight = false;
      scene.actor.x = 92;
      scene.actor.y = 48;
      scene.actor.interrupt(introBottle());
    }
    const u = easeInOut(takeProgress(time, INTRO.bottle, INTRO.archipelago));
    zoomOverride.scene = clampScale(sceneFit * 2, scaleLimits(sceneFit));
    cameras.scene = { x: 124 - u * 14, y: 12 + u * 6 };
  } else if (take === 'archipelago') {
    activeView = 'map';
    if (changed) cameras.map = { x: islands[0].x, y: islands[0].y - 8 };
    const u = easeInOut(takeProgress(time, INTRO.archipelago, INTRO.descent));
    zoomOverride.map = mapLimits.max + (mapLimits.min - mapLimits.max) * u;
  } else {
    activeView = 'map';
    const u = easeInOut(takeProgress(time, INTRO.descent, INTRO.end));
    zoomOverride.map = mapLimits.min + (mapFit - mapLimits.min) * u;
  }
  renderIntroTerminal();
}

function finishIntro(skipped) {
  intro = null;
  introOverlay.hidden = true;
  document.body.classList.remove('em-abertura');
  zoomOverride.map = null;
  zoomOverride.scene = null;
  scene.showDistantLight = false;
  cameras.map = { x: islands[0].x, y: islands[0].y - 8 };
  const main = islands[0].spec;
  if (islands.length > 1) {
    switchView('map');
  } else if (skipped) {
    switchView('scene', main);
  } else {
    switchView('map');
    startTransition(window.innerWidth / 2, window.innerHeight / 2, () => switchView('scene', main));
  }
  wakePanels();
  const next = afterIntro;
  afterIntro = null;
  next?.();
}

// Qualquer tecla, clique ou toque pula. Pula sem chegar aos controles que estão por baixo.
function setupIntroSkip() {
  const skip = (event) => {
    if (!intro) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (canSkipIntro(intro.time)) finishIntro(true);
  };
  window.addEventListener('keydown', skip, { capture: true });
  window.addEventListener('pointerdown', skip, { capture: true });
}

// Painéis somem quando ninguém mexe no mouse, deixando só o quadro vivo.
function setupIdle() {
  const wake = () => {
    document.body.classList.remove('ocioso');
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (card.hidden && !openModal) document.body.classList.add('ocioso');
    }, IDLE_AFTER_MS);
  };
  ['pointermove', 'pointerdown', 'keydown', 'focusin'].forEach((type) => window.addEventListener(type, wake));
  wakePanels = wake;
  wake();
}

function setupKeyboard() {
  window.addEventListener('keydown', (event) => {
    if (openModal) {
      if (event.key === 'Escape') closeModal();
      return;
    }
    if (event.key === '+' || event.key === '=') zoomBy(1);
    else if (event.key === '-') zoomBy(-1);
    else if (event.key === '0') zoomToFit();
    else if (event.key === 'Escape') {
      if (!card.hidden) closeCard();
      else if (activeView === 'scene' && !fullscreenElement()) backButton.click();
    }
  });
}

// Marcos reais do repositório: cada navegador comemora cada um uma vez.
function deliverMilestone() {
  if (intro || activeView !== 'scene' || dev.activity || readingAnchor || transition) return false;
  let seen = [];
  try {
    seen = JSON.parse(localStorage.getItem(MILESTONES_KEY)) ?? [];
  } catch {
    return false;
  }
  const [milestone] = pendingMilestones(scene.spec, { forks: appData.totalForks }, seen, dateNow());
  if (!milestone) return false;
  try {
    localStorage.setItem(MILESTONES_KEY, JSON.stringify([...seen, milestone]));
  } catch {
    return false;
  }
  const key = milestone.startsWith('aniversario') ? 'aniversario' : milestone;
  const current = scene;
  current.celebrate(() => openBalloon(() => TEXT.milestones[key], () => current.anchor()), stopReading);
  return true;
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
  // Agendar antes de desenhar mantém a animação viva mesmo se um quadro falhar.
  requestAnimationFrame(frame);
  const dt = Math.min((now - previousFrame) / 1000, 0.1);
  previousFrame = now;
  // Em aba ou painel oculto a tela pode ter tamanho zero.
  if (window.innerWidth === 0 || window.innerHeight === 0) return;
  if (canvas.width === 0 || canvas.height === 0) resize();
  ctx.imageSmoothingEnabled = false;
  if (intro) updateIntro(dt);

  if (activeView === 'scene') {
    scene.update(dt);
    scene.render(ctx, scale(), cameras.scene, canvas.width, canvas.height, now / 1000, dt);
  } else {
    drawMap(now, dt);
  }

  drawTransition(dt);
  if (readingAnchor) positionFloating(balloon, readingAnchor());
  if (cardAnchor && !card.hidden) positionFloating(card, cardAnchor(), true);
}

async function start() {
  // A URL pública é uma só: a página de um fork leva à ilha daquela pessoa na Mãe.
  const redirect = forkRedirectUrl(window.location);
  if (redirect) {
    window.location.replace(redirect);
    return;
  }

  const loaded = await loadData(window.location);
  appData = loaded.data;
  online = loaded.online;

  const wantedLogin = requestedIsland(window.location);
  const specs = buildIslandSpecs(appData, wantedLogin);
  islands = specs.map((spec, index) => {
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

  const focus = wantedLogin ? findIslandSpec(specs, wantedLogin) : null;
  const startSpec = focus ?? islands[0].spec;
  const startInScene = dev.view === 'cena' || (dev.view !== 'mapa' && (Boolean(focus) || islands.length === 1));
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  setupZoomMenu();
  setupFullscreen();
  setupHud();
  switchView(startInScene ? 'scene' : 'map', startInScene ? startSpec : null);
  applyLanguage();
  updateMapView();
  resize();
  window.addEventListener('resize', resize);
  setupIntroSkip();
  setupPointer();
  setupKeyboard();
  setupIdle();

  const dropNewStars = () => {
    if (dev.activity || !starsAreNew(startSpec)) return;
    if (scene?.spec.login === startSpec.login) scene.dropCrate();
    islands[0].dropCrate();
  };
  let introSeen = false;
  try {
    introSeen = localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    introSeen = false;
  }
  const playIntro = shouldPlayIntro({
    seen: introSeen,
    wantedIsland: wantedLogin,
    reducedMotion: REDUCED_MOTION,
    forced: dev.intro,
    testingScene: Boolean(dev.activity || dev.view),
  });
  if (playIntro) {
    afterIntro = dropNewStars;
    startIntro();
  } else {
    dropNewStars();
  }
  window.setInterval(deliverMilestone, MILESTONE_CHECK_MS);
  requestAnimationFrame(frame);
}

start();
