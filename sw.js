/**
 * TOMBSTONE SERVICE WORKER.
 *
 * This file exists to *remove* a service worker, not to install one. It has no fetch
 * handler and caches nothing.
 *
 * Background. The pre-suite OfficeNinja (a set of hand-written .html pages that used to
 * live in this directory) registered `/sw.js` from `js/officeninja.js`. That worker was
 * cache-first over `/`, `/index.html`, `/word.html`, `/excel.html` and `/powerpoint.html`,
 * with scope `/`. Deleting those files from the repository does nothing for anyone who
 * already loaded that site: the registration lives in their browser profile, the responses
 * live in their Cache Storage, and the worker happily keeps serving the dead app forever.
 * A 404 on this path is not a reliable fix either — behaviour differs between browsers, and
 * even where the registration is dropped the caches are left behind.
 *
 * So the path has to keep answering, with something that dismantles the old install:
 * take control, delete every `officeninja-*` cache, unregister, then reload the pages we
 * control so they load whatever the origin actually serves today.
 *
 * WHICH FILE DOES THE REAL WORK. The live site is GitHub Pages serving `main` -> `/docs`,
 * so this root file is NOT what microslop.xyz serves at `/sw.js`. There, `/sw.js` is the
 * generated suite worker (`docs/sw.js`, built from `suite/service-worker.js`), which
 * occupies the same URL and scope and therefore supersedes the legacy registration
 * outright; its `activate` handler deletes every cache under the `officeninja-` prefix,
 * including the legacy `officeninja-v1`. That is the self-heal for real users.
 *
 * This file covers the other cases: anyone serving the repository root directly (a local
 * static server, a fork, or Pages being repointed at `/`), where the suite worker is not
 * present and the only thing that can undo the legacy registration is this.
 *
 * Do not "restore" this into a caching worker. If root-serving ever comes back, build the
 * suite and serve `suite/dist`, which ships its own versioned worker.
 */

self.addEventListener('install', () => {
  // Unlike the suite worker, taking over immediately is correct here: this worker serves
  // nothing, so there is no risk of swapping a running page onto a mismatched bundle. The
  // sooner it replaces the legacy worker, the sooner the stale cache stops being served.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('officeninja-')).map((key) => caches.delete(key)));

      // Claim first: a client we do not control cannot be reloaded through the SW API, and
      // legacy tabs opened before this worker existed are exactly the ones that need it.
      await self.clients.claim();

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Unregister before reloading, so the reloaded pages come up uncontrolled and hit the
      // network instead of being handed back to a worker that is on its way out.
      await self.registration.unregister();

      await Promise.all(
        clients.map((client) => {
          try {
            return client.navigate(client.url).catch(() => undefined);
          } catch {
            return undefined;
          }
        }),
      );
    })(),
  );
});
