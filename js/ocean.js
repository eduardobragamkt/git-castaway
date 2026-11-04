// Oceano infinito: cada célula do mundo tem um padrão fixo, e só o que está na tela é desenhado.

const CELL = 18;

function cellHash(x, y) {
  let hash = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return (hash ^ (hash >>> 16)) >>> 0;
}

export function drawOcean(ctx, S, view, time, width, height) {
  ctx.fillStyle = '#1b6a8a';
  ctx.fillRect(0, 0, width, height);

  for (let cy = Math.floor(view.top / CELL); cy <= Math.floor(view.bottom / CELL); cy += 1) {
    for (let cx = Math.floor(view.left / CELL); cx <= Math.floor(view.right / CELL); cx += 1) {
      const hash = cellHash(cx, cy);
      if (hash % 4 !== 0) continue;
      const cycle = (time * 0.45 + ((hash >>> 4) % 97) / 24) % 2;
      if (cycle > 1.25) continue;
      const drift = Math.round(cycle * 2);
      const x = Math.round((cx * CELL + (hash >>> 8) % CELL + drift - view.left) * S);
      const y = Math.round((cy * CELL + (hash >>> 13) % CELL - view.top) * S);
      ctx.fillStyle = hash % 3 === 0 ? '#5cb4c6' : '#3a93ad';
      ctx.fillRect(x, y, (3 + (hash >>> 20) % 4) * S, S);
    }
  }
}
