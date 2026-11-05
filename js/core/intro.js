// A abertura em cinco tomadas: um log de Git digitado enquanto a câmera vai do mar até a ilha.

export const INTRO = { sea: 2, bottle: 5, archipelago: 8, descent: 10, end: 12 };

const TYPE_SECONDS_PER_LETTER = 0.04;
const SKIP_DELAY_SECONDS = 0.25;

// Primeira visita, sem link direto para uma ilha e sem pedido de menos movimento.
export function shouldPlayIntro({ seen, wantedIsland, reducedMotion, forced = false, testingScene = false }) {
  if (forced) return true;
  return !seen && !wantedIsland && !reducedMotion && !testingScene;
}

export function introTake(time) {
  if (time < INTRO.sea) return 'terminal';
  if (time < INTRO.bottle) return 'sea';
  if (time < INTRO.archipelago) return 'bottle';
  if (time < INTRO.descent) return 'archipelago';
  return 'descent';
}

// Os comandos ficam iguais em qualquer idioma; as frases vêm dos textos da interface.
export function introLines(days, islandCount, text) {
  return [
    { at: 0.3, text: '$ git init island' },
    { at: INTRO.sea + 0.15, text: '$ git add castaway' },
    { at: INTRO.bottle + 0.15, text: `$ git commit -m "day ${days}"` },
    { at: INTRO.archipelago + 0.15, text: text.introIslands(islandCount) },
    { at: INTRO.descent + 0.15, text: text.introWelcome },
  ];
}

export function typedText(line, time) {
  if (time < line.at) return '';
  return line.text.slice(0, Math.floor((time - line.at) / TYPE_SECONDS_PER_LETTER) + 1);
}

export function canSkipIntro(time) {
  return time >= SKIP_DELAY_SECONDS;
}

export function curtainOpacity(time) {
  const fadeStart = INTRO.sea - 0.2;
  if (time <= fadeStart) return 1;
  return Math.max(0, 1 - (time - fadeStart) / 0.4);
}

export function easeInOut(value) {
  const t = Math.max(0, Math.min(1, value));
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function takeProgress(time, start, end) {
  return Math.max(0, Math.min(1, (time - start) / (end - start)));
}
