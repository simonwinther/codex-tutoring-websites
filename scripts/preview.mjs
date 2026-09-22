import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const output = fileURLToPath(new URL('../_site/', import.meta.url));
const { base } = JSON.parse(await readFile(join(output, 'sites.json'), 'utf8'));
const port = Number(process.env.PORT || 4178);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/' && base !== '/' || url.pathname === base.slice(0, -1)) {
      response.writeHead(302, { Location: base }); response.end(); return;
    }
    if (!url.pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return; }
    let path = resolve(output, decodeURIComponent(url.pathname.slice(base.length)));
    if (path !== resolve(output) && !path.startsWith(resolve(output) + sep)) { response.writeHead(403); response.end(); return; }
    if ((await stat(path)).isDirectory()) {
      if (!url.pathname.endsWith('/')) { response.writeHead(301, { Location: url.pathname + '/' + url.search }); response.end(); return; }
      path = join(path, 'index.html');
    }
    const info = await stat(path);
    response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache' });
    if (request.method === 'HEAD') response.end();
    else createReadStream(path).on('error', () => response.destroy()).pipe(response);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${base}`));
