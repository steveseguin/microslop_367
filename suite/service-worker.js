/**
 * OfficeNinja service worker (template).
 *
 * This file is NOT shipped as-is. `swPlugin` in vite.config.ts reads it after every build,
 * substitutes the three `__SW_*__` placeholders with the real hashed filenames from
 * dist/, and writes the result to `dist/sw.js`. That indirection is the whole cache
 * invalidation strategy: because the substituted manifest contains content hashes, the
 * BYTES OF sw.js CHANGE ON EVERY DEPLOY THAT CHANGES ANY ASSET. A service worker only
 * updates when its own script differs byte-for-byte, so this is what makes a new deploy
 * actually reach a returning user. Hand-editing dist/sw.js, or making the version a
 * constant you have to remember to bump, is how the previous incarnation of this repo
 * ended up serving a stale bundle forever.
 *
 * Two cache tiers, both keyed by the build version:
 *
 *   officeninja-shell-<version>    Precached during `install`. Install FAILS if any of it
 *                                  fails, so the shell is all-or-nothing and a half-cached
 *                                  app can never be committed.
 *   officeninja-runtime-<version>  Everything else: the editor engines. Filled lazily,
 *                                  either by a real request or by the idle warm pass the
 *                                  page asks for once it is interactive.
 *
 * Every asset under assets/ is content-hashed, so cache-first on them is always correct:
 * a given URL's bytes can never change. index.html is NOT hashed, and is therefore only
 * ever served from the shell cache of the currently-active worker — a new worker builds a
 * new shell cache containing the new index.html, and the old cache is deleted on activate.
 */

const VERSION = '__SW_VERSION__';
const SHELL_CACHE = `officeninja-shell-${VERSION}`;
const RUNTIME_CACHE = `officeninja-runtime-${VERSION}`;

/**
 * Only caches under this prefix are ever deleted. The blanket
 * `caches.keys().then(delete everything else)` you see in most tutorials would also destroy
 * cache storage owned by anything else on the origin. It also happens to be what cleans up
 * the legacy `officeninja-v1` cache left behind by the pre-suite site (see the tombstone at
 * the repository root) — that name shares this prefix, so an old client that reaches this
 * worker self-heals on activate.
 */
const CACHE_PREFIX = 'officeninja-';

/** Precached on install. Kept small on purpose; see the budget check in vite.config.ts. */
const SHELL_ASSETS = __SW_SHELL__;

/** Cached on first use, or during the idle warm pass. Multiple megabytes. */
const WARM_ASSETS = __SW_WARM__;

const toUrl = (path) => new URL(path, self.location.href).href;

const SHELL_URLS = SHELL_ASSETS.map(toUrl);
const WARM_URLS = WARM_ASSETS.map(toUrl);
const MANAGED_URLS = new Set([...SHELL_URLS, ...WARM_URLS]);
const INDEX_URL = toUrl('index.html');

self.addEventListener('install', (event) => {
  /**
   * NO skipWaiting() here. On a first install there is no active worker, so this worker
   * activates immediately anyway. On an UPDATE it deliberately parks in `waiting` while
   * the old worker keeps serving the tab the user is currently typing in. Taking over
   * mid-session would mean the running page's next lazy `import()` (opening Excel, say)
   * resolves against a cache that no longer holds the chunk that page was built against.
   * The page decides when to swap; see registerServiceWorker.ts.
   */
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_URLS.map((url) => new Request(url, { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
      // Control the page that installed us, so a first visit is offline-capable without a
      // second reload. Safe on update too: activation only happens once the page has
      // agreed to it (skipWaiting) or every tab has closed.
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const type = event.data && event.data.type;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'WARM_OFFLINE') {
    event.waitUntil(warmOfflineAssets());
  }
});

let warmInFlight = null;

/**
 * Pull the editor engines into the runtime cache, one at a time.
 *
 * Sequential and un-awaited by anything on the critical path: this runs after the page has
 * reported itself interactive, and a serial loop keeps it from competing for sockets with
 * whatever the user is actually doing. Failures are swallowed per-asset — a partial warm is
 * strictly better than none, and anything missed is still cache-on-first-use.
 */
function warmOfflineAssets() {
  if (warmInFlight) return warmInFlight;

  warmInFlight = (async () => {
    const cache = await caches.open(RUNTIME_CACHE);

    for (const url of WARM_URLS) {
      if (await cache.match(url)) continue;

      try {
        const response = await fetch(url);
        if (response.ok) await cache.put(url, response);
      } catch {
        // Offline, or the asset moved. Cache-on-first-use still covers it.
      }
    }
  })().finally(() => {
    warmInFlight = null;
  });

  return warmInFlight;
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { ignoreSearch: false });
  if (cached) return cached;

  const response = await fetch(request);

  // Only ever store a complete, same-origin 200. Caching a 206 makes the entry unusable,
  // and caching an opaque cross-origin response hides failures behind a blank asset.
  if (response.ok && response.type === 'basic' && response.status === 200) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /**
   * Navigations. HashRouter means every route is the same document, so the shell copy of
   * index.html answers all of them. Cache-first (not network-first) is what makes an
   * offline launch instant rather than waiting out a network timeout; staleness is
   * impossible because a new deploy ships a new sw.js, which builds a new shell cache.
   */
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(INDEX_URL);
        if (cached) return cached;

        try {
          return await fetch(request);
        } catch {
          const fallback = await caches.match(INDEX_URL);
          if (fallback) return fallback;
          throw new Error('offline and no cached shell');
        }
      })(),
    );
    return;
  }

  // Known build output: immutable, hashed, cache-first.
  if (MANAGED_URLS.has(url.href)) {
    event.respondWith(cacheFirst(request, SHELL_URLS.includes(url.href) ? SHELL_CACHE : RUNTIME_CACHE));
    return;
  }

  // Anything else same-origin under scope (a font subset for a script we did not warm, an
  // asset added after this worker shipped). Cache-first into the runtime cache so it works
  // on the next offline launch. Out-of-scope URLs are left entirely alone.
  if (url.href.startsWith(new URL('./', self.location.href).href)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});
