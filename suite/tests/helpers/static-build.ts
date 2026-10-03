import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** A loopback-only static host for offline tests. Vite preview adds Vary: Origin
 * to same-origin scripts: its module and worker fetch variants can disagree in
 * Cache Storage. Exercise the shipped files without changing production caching
 * or weakening CORS in the normal development/preview server. */
export async function serveStaticBuild() {
  const root = fileURLToPath(new URL('../../dist/', import.meta.url));
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.wasm': 'application/wasm',
  };
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405).end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(request.url ?? '/', 'http://localhost').pathname,
      );
      const target = path.resolve(
        root,
        `.${pathname.endsWith('/') ? pathname + 'index.html' : pathname}`,
      );
      if (!target.startsWith(root)) {
        response.writeHead(403).end();
        return;
      }
      const content = await readFile(target);
      response.writeHead(200, {
        'Content-Type':
          mime[path.extname(target)] ?? 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Static test host did not start');
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
