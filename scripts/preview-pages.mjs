import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const base = '/secondshelf/';
const types = { '.json':'application/json', '.bin':'application/octet-stream', '.jpg':'image/jpeg', '.png':'image/png', '.txt':'text/plain', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/secondshelf') { res.writeHead(302, { Location: base }); res.end(); return; }
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  const relative = path.startsWith(base) ? path.slice(base.length) : path.slice(1);
  const file = resolve(root, relative || 'index.html');
  const type = types[extname(file)];
  if (!file.startsWith(root + sep) || !type || !existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': type + (type.startsWith('text/') || type === 'application/json' ? '; charset=utf-8' : ''), 'Cache-Control': 'no-store' });
  res.end(readFileSync(file));
});
server.listen(Number(process.env.PAGES_PORT || 4322), '127.0.0.1', () => console.log(`Pages preview: http://127.0.0.1:${server.address().port}${base}`));
