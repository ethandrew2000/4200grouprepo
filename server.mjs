import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const backend = 'https://two026-it4200-fall.onrender.com';
const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') { res.writeHead(405); res.end('Method not allowed'); return; }
  try {
    if (url.pathname.startsWith('/api/backend')) {
      const path = url.pathname.slice('/api/backend'.length) || '/';
      if (!path.startsWith('/') || path.startsWith('//')) { res.writeHead(400); res.end(); return; }
      const response = await fetch(backend + path + url.search, { signal: AbortSignal.timeout(60000), redirect: 'error' });
      res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' });
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const file = files[url.pathname];
    if (!file) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': file[1] + '; charset=utf-8' });
    res.end(await readFile(fileURLToPath(new URL('./public/' + file[0], import.meta.url))));
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'The backend is taking a little longer. Please try again.', detail: error.message }));
  }
});
server.listen(process.env.PORT || 3000, () => console.log(`4200 Arcade → http://localhost:${process.env.PORT || 3000}`));
