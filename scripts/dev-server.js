// Servidor estático mínimo para desenvolvimento local. Não é usado em produção.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).slice(1);
  const file = normalize(join(ROOT, relative));
  try {
    if (!file.startsWith(ROOT + sep)) throw new Error('fora da raiz');
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('Não encontrado');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Git Castaway em http://localhost:${PORT}`);
});
