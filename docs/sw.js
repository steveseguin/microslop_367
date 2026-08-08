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

const VERSION = "7c0ceb63e842";
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

/**
 * Caches belonging to the pre-suite site (its worker used `officeninja-v1`).
 *
 * Their presence is the only reliable signal that the worker we are about to replace is the
 * legacy one rather than an older build of this app, and it changes the update rules — see
 * `install`. Nothing else writes a cache with this shape.
 */
const LEGACY_CACHE_PATTERN = /^officeninja-v\d+$/;

/** Precached on install. Kept small on purpose; see the budget check in vite.config.ts. */
const SHELL_ASSETS = [
  "./assets/Dashboard-Cj5T1oA1.js",
  "./assets/db-paxG37Wo.js",
  "./assets/framework-UhDwY1uT.js",
  "./assets/index-Cpf08yo3.css",
  "./assets/index-CsNR6eKv.js",
  "./assets/index-Dgkxep6c.js",
  "./assets/inter-latin-wght-italic-DpCbqKDY.woff2",
  "./assets/inter-latin-wght-normal-Dx4kXJAl.woff2",
  "./assets/route-loader-PPVm8Dsz.js",
  "./assets/router-Drf7dCkz.js",
  "./assets/storage-Dob3nYDb.js",
  "./assets/ui-icons-DW_zP77Q.js",
  "./favicon.svg",
  "./index.html",
  "./manifest.webmanifest",
  "./vite.svg"
];

/** Cached on first use, or during the idle warm pass. Multiple megabytes. */
const WARM_ASSETS = [
  "./assets/Excel-H8jDcd36.js",
  "./assets/ExcelWorkbook-BdEgVCf9.js",
  "./assets/PowerPoint-A_2JAODp.js",
  "./assets/SelectionChart-Wc-QAbsv.js",
  "./assets/Word-B82W9KHN.js",
  "./assets/__vite-browser-external-BIHI7g3E.js",
  "./assets/excel-chart-CLI4euYl.js",
  "./assets/excel-io-CKwrMZHi.js",
  "./assets/excel-workbook-4zfA6_yO.css",
  "./assets/excel-workbook-CxjC2I5R.js",
  "./assets/inter-cyrillic-ext-wght-italic-B5xAaiFk.woff2",
  "./assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2",
  "./assets/inter-cyrillic-wght-italic-DzZdc28x.woff2",
  "./assets/inter-cyrillic-wght-normal-DqGufNeO.woff2",
  "./assets/inter-greek-ext-wght-italic-DcOpz6Lw.woff2",
  "./assets/inter-greek-ext-wght-normal-DlzME5K_.woff2",
  "./assets/inter-greek-wght-italic-CILZdfAp.woff2",
  "./assets/inter-greek-wght-normal-CkhJZR-_.woff2",
  "./assets/inter-latin-ext-wght-italic-0pjOp8NU.woff2",
  "./assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2",
  "./assets/inter-vietnamese-wght-italic-K3WlGtc8.woff2",
  "./assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2",
  "./assets/slides-canvas-DGUIQptF.js",
  "./assets/slides-io-j3t42tXf.js",
  "./assets/word-editor-DD7vOoFx.js",
  "./assets/word-io-BG_oEF9a.js",
  "./assets/zip-runtime-B94crdom.js"
];

const toUrl = (path) => new URL(path, self.location.href).href;

const SHELL_URLS = SHELL_ASSETS.map(toUrl);
const WARM_URLS = WARM_ASSETS.map(toUrl);
const MANAGED_URLS = new Set([...SHELL_URLS, ...WARM_URLS]);
const INDEX_URL = toUrl('index.html');
const ASSETS_URL_PREFIX = toUrl('assets/');

/**
 * How to fetch a file during precache.
 *
 * Everything under assets/ is content-hashed, so the HTTP cache cannot hold a wrong answer
 * for those URLs no matter what max-age the host sends (GitHub Pages sends 600s, not
 * `immutable`). `cache: 'default'` therefore lets the browser reuse the copy the page just
 * downloaded instead of pulling ~440 kB down a second time on a first visit. Measured: with
 * `'reload'` for everything, a cold visit re-fetched all 16 shell files; with this split it
 * re-fetches one, index.html, at ~1 kB.
 *
 * Everything else (index.html above all) is served from an unhashed URL under a short
 * max-age, and MUST bypass the HTTP cache. A minutes-old index.html would reference asset
 * hashes from the previous deploy, which are not in this worker's manifest — precaching it
 * would bake a broken shell into the cache permanently.
 */
function precacheRequest(url) {
  return new Request(url, { cache: url.startsWith(ASSETS_URL_PREFIX) ? 'default' : 'reload' });
}

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
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_URLS.map(precacheRequest));

      /**
       * ONE EXCEPTION to "never skipWaiting": replacing the legacy worker.
       *
       * That worker is cache-first over `/`, `/word.html`, `/excel.html` and
       * `/powerpoint.html` with scope `/`, so a client that still has it keeps being served
       * the dead pre-suite app out of `officeninja-v1` — including the navigation that just
       * installed this worker. Waiting politely means waiting for a page that will never
       * appear to offer an update it cannot render, i.e. never. Measured, not assumed: with
       * the normal wait-for-consent path, a legacy client sat on `officeninja-v1` forever.
       *
       * The reasons not to skipWaiting do not apply here. The page being replaced is a
       * different application, not a running editor built against chunks this worker is
       * about to evict, and everything the legacy editors held was already autosaved to
       * localStorage, which a reload does not touch.
       */
      const keys = await caches.keys();
      if (keys.some((key) => LEGACY_CACHE_PATTERN.test(key))) await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Recomputed here rather than carried over from `install`: the worker can be killed
      // between the two events, so module-scope state is not reliable.
      const healingLegacy = keys.some((key) => LEGACY_CACHE_PATTERN.test(key));

      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
      // Control the page that installed us, so a first visit is offline-capable without a
      // second reload. Safe on update too: activation only happens once the page has
      // agreed to it (skipWaiting) or every tab has closed.
      await self.clients.claim();

      if (healingLegacy) {
        // Those windows are currently displaying the legacy app, painted from a cache that
        // no longer exists. Leaving them there would strand the user on a dead page until
        // they happened to reload by hand.
        //
        // DELIBERATELY NOT AWAITED. The navigation cannot complete until this worker has
        // finished activating (it is the one that must answer the request), and activation
        // cannot finish while `waitUntil` is still waiting on the navigation. Awaiting it
        // deadlocks the worker in `activating` forever — verified, not theorised. Firing it
        // and returning lets activation finish and the navigation resolve against it.
        const windows = await self.clients.matchAll({ type: 'window' });
        for (const client of windows) {
          try {
            client.navigate(client.url).catch(() => undefined);
          } catch {
            // Some clients (a client that has since navigated cross-origin) refuse.
          }
        }
      }
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
