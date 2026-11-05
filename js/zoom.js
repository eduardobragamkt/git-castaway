// Regras do zoom. A escala é sempre um número inteiro de pixels do dispositivo por pixel
// da arte, o que mantém os pixels nítidos e todos do mesmo tamanho.

const SCENE_MIN_WIDTH = 345;
const SCENE_MIN_HEIGHT = 250;

export function fitScale(viewName, cssWidth, cssHeight, dpr) {
  if (viewName === 'scene') {
    const fit = Math.min((cssWidth * dpr) / SCENE_MIN_WIDTH, (cssHeight * dpr) / SCENE_MIN_HEIGHT);
    return Math.max(1, Math.floor(fit));
  }
  const base = Math.max(2, Math.min(Math.min(cssWidth, cssHeight) / 300, 7));
  return Math.max(1, Math.round(base * dpr));
}

export function scaleLimits(fit) {
  return { min: Math.max(1, Math.ceil(fit / 2)), max: Math.max(fit + 2, fit * 3) };
}

export function clampScale(scale, limits) {
  return Math.max(limits.min, Math.min(limits.max, Math.round(scale)));
}

export function stepScale(scale, direction, limits) {
  const step = Math.max(1, Math.round(scale * 0.25));
  return clampScale(scale + direction * step, limits);
}

export function zoomPercent(scale, fit) {
  return Math.round((scale / fit) * 100);
}

// Recalcula a câmera para o ponto sob o cursor continuar no mesmo lugar depois do zoom.
export function cameraAfterZoom(camera, pointer, canvasSize, oldScale, newScale) {
  const offsetX = pointer.x - canvasSize.width / 2;
  const offsetY = pointer.y - canvasSize.height / 2;
  return {
    x: camera.x + offsetX / oldScale - offsetX / newScale,
    y: camera.y + offsetY / oldScale - offsetY / newScale,
  };
}

// A cena só permite arrastar quando o zoom corta parte do conteúdo.
export function clampSceneCamera(camera, viewWidth, viewHeight) {
  const limitX = Math.max(0, 195 - viewWidth / 2);
  const limitY = Math.max(0, 130 - viewHeight / 2);
  return {
    x: Math.max(-limitX, Math.min(limitX, camera.x)),
    y: Math.max(-limitY, Math.min(limitY, camera.y)),
  };
}
