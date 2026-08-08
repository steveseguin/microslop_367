/**
 * Service worker registration, update handling, and the idle offline warm-up.
 *
 * The service worker itself lives in `suite/service-worker.js` and is generated into
 * `dist/sw.js` at build time. This module is the page's half of the contract.
 *
 * Three decisions are encoded here.
 *
 * 1. UPDATES ARE OFFERED, NEVER FORCED. A new worker installs in the background and parks
 *    in `waiting`. Nothing about the running page changes until the user accepts. The
 *    alternative — `skipWaiting()` on install — swaps the caches out from under a live tab:
 *    the next lazy `import()` (opening Excel from the Dashboard) would then resolve against
 *    a build the running page was not compiled against, and every document in this app is
 *    unsaved work sitting in IndexedDB. A reload the user did not ask for is not an
 *    acceptable price for shipping a bugfix five minutes sooner.
 *
 * 2. THE WARM PASS IS DEFERRED, NOT PART OF INSTALL. Precaching every editor engine would
 *    make installation a ~5 MB download. Instead the shell (~440 kB) is precached, and once
 *    the app is interactive we ask the worker to pull the engines down in the background.
 *    Deferring past first paint is what keeps time-to-interactive where it was.
 *
 * 3. `updateViaCache: 'none'`. Browsers may serve sw.js from the HTTP cache for up to 24
 *    hours when checking for updates. On GitHub Pages that would mean a deploy could take a
 *    day to reach a returning user. This forces the update check to the network.
 */

const WARM_DELAY_MS = 3_000;
const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1_000;

/** Resolve a path against the app root, which is where sw.js sits and where its scope is. */
function appUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

function isSaveDataEnabled(): boolean {
  try {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return connection?.saveData === true;
  } catch {
    return false;
  }
}

/**
 * Ask the active worker to pull the editor engines into the runtime cache.
 *
 * Skipped entirely under Save-Data: someone who has asked the browser to conserve bytes has
 * not asked for a 5 MB speculative download. They still get the offline shell, and each
 * editor is still cached the first time they open it.
 */
function scheduleOfflineWarmUp(registration: ServiceWorkerRegistration) {
  if (isSaveDataEnabled()) return;

  const run = () => {
    const worker = registration.active ?? navigator.serviceWorker.controller;
    worker?.postMessage({ type: 'WARM_OFFLINE' });
  };

  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void })
    .requestIdleCallback;

  window.setTimeout(() => {
    if (idle) idle(run, { timeout: 10_000 });
    else run();
  }, WARM_DELAY_MS);
}

/**
 * Register the worker.
 *
 * `onUpdateReady` is called with an `apply` callback once a newer worker is installed and
 * waiting. Calling `apply()` activates it and reloads the page; not calling it leaves the
 * user on the version they started with until every tab is closed.
 */
export function registerServiceWorker(onUpdateReady: (apply: () => void) => void): void {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  let reloading = false;

  const applyUpdate = (waiting: ServiceWorker) => () => {
    if (reloading) return;
    reloading = true;

    // The reload is driven by `controllerchange`, not by a timer, so it happens exactly
    // when the new worker is in charge and never before.
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.location.reload();
      },
      { once: true },
    );

    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const announceIfWaiting = (registration: ServiceWorkerRegistration) => {
    // `controller` is null on a brand new install; a waiting worker then is not an update,
    // it is the very first one, and there is nothing for the user to accept.
    if (registration.waiting && navigator.serviceWorker.controller) {
      onUpdateReady(applyUpdate(registration.waiting));
    }
  };

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register(appUrl('sw.js'), {
        scope: appUrl('./'),
        updateViaCache: 'none',
      });

      announceIfWaiting(registration);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') announceIfWaiting(registration);
        });
      });

      // Check for a new deploy when the tab comes back to the foreground, and on a slow
      // timer for tabs that are simply left open for days.
      let lastCheck = Date.now();
      const check = () => {
        if (document.visibilityState !== 'visible') return;
        if (Date.now() - lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
        lastCheck = Date.now();
        void registration.update().catch(() => {});
      };
      document.addEventListener('visibilitychange', check);
      window.setInterval(check, UPDATE_CHECK_INTERVAL_MS);

      await navigator.serviceWorker.ready;
      scheduleOfflineWarmUp(registration);
    } catch {
      // No service worker: an unsupported browser, a blocked registration (Playwright sets
      // `serviceWorkers: 'block'`), or an insecure origin. The app is fully functional
      // without one — it just is not offline-capable.
    }
  };

  if (document.readyState === 'complete') void start();
  else window.addEventListener('load', () => void start(), { once: true });
}
