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

const VERSION = "3921ab7cd0bb";
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
  "./.nojekyll",
  "./assets/AppMark-BbQKMbw9.js",
  "./assets/Dashboard-Bq1kct10.js",
  "./assets/Dictate-B3af17rE.js",
  "./assets/Dictate-D_9UPn2h.css",
  "./assets/LiveShare-6e5ekY-2.js",
  "./assets/LiveShare-DmjISe2K.css",
  "./assets/ToolShell-DlOqNQbh.js",
  "./assets/background-DZqfXkNv.js",
  "./assets/blueline-BERFp9MN.js",
  "./assets/db-DUSNBQ0e.js",
  "./assets/engine-PF_oLV6R.js",
  "./assets/framework-CUtJR0oF.js",
  "./assets/handoff-BcmaBzy2.js",
  "./assets/image-CEA58GUw.css",
  "./assets/index-BUu2k986.js",
  "./assets/index-DB3lcKBq.css",
  "./assets/index-pO88YmGS.js",
  "./assets/inter-latin-wght-italic-DpCbqKDY.woff2",
  "./assets/inter-latin-wght-normal-Dx4kXJAl.woff2",
  "./assets/ninja-DoaIHFv8.js",
  "./assets/p2p-BltU7KEl.js",
  "./assets/qrcode-DJw-22Yv.js",
  "./assets/route-loader-PPVm8Dsz.js",
  "./assets/router-DRvEhcA9.js",
  "./assets/session-D9sHx6DL.js",
  "./assets/snapshot-Bdtk12mK.js",
  "./assets/storage-Dob3nYDb.js",
  "./assets/suiteApps-D8MsyBXP.js",
  "./assets/sync-CpVFTeXX.css",
  "./assets/toolStorage-DrINF3dH.js",
  "./assets/tools-B5dIkb_u.css",
  "./assets/ui-icons-CHd_xMMu.js",
  "./assets/useYText-C7xSmHpI.js",
  "./assets/words-DAj5n5a1.js",
  "./favicon.svg",
  "./index.html",
  "./manifest.webmanifest",
  "./robots.txt",
  "./sitemap.xml",
  "./vite.svg"
];

/** Cached on first use, or during the idle warm pass. Multiple megabytes. */
const WARM_ASSETS = [
  "./assets/Board-BO37jweK.css",
  "./assets/Board-BcObNEko.js",
  "./assets/Chat-BXVN5Dbo.css",
  "./assets/Chat-rZJVpiXF.js",
  "./assets/Drop-Cb0DWP5A.js",
  "./assets/Drop-DKSNFDfr.css",
  "./assets/Excel-ztwg2DPb.js",
  "./assets/ExcelWorkbook-Dp5JFMQT.js",
  "./assets/Image-BGl-7IkA.js",
  "./assets/Meet-DAL6NyHb.js",
  "./assets/MeetRoom-ClIm9ryX.js",
  "./assets/Notes-BCU4ge1F.css",
  "./assets/Notes-DO8kodl2.js",
  "./assets/Pdf-B6p19D3-.js",
  "./assets/PowerPoint-Cw5rB8Br.js",
  "./assets/SelectionChart-Dg5dUc3V.js",
  "./assets/Svg-BWwOkZBQ.js",
  "./assets/Svg-HlzpoMkN.css",
  "./assets/Sync-C0vv_Bf3.js",
  "./assets/Time-DbPbpU7X.js",
  "./assets/Time-ORO_SQcj.css",
  "./assets/Word-BAG0o3_d.js",
  "./assets/__vite-browser-external-BIHI7g3E.js",
  "./assets/excel-chart-2uwRaG3y.js",
  "./assets/excel-io-CKwrMZHi.js",
  "./assets/excel-workbook-4zfA6_yO.css",
  "./assets/excel-workbook-BfXoJ_WG.js",
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
  "./assets/pdf-engine-C_QbEgd5.js",
  "./assets/pdf-renderer-DIMUS0Sx.js",
  "./assets/pdf.worker-DUp-pgyP.js",
  "./assets/slides-canvas-DGUIQptF.js",
  "./assets/slides-io-BwrBIGXO.js",
  "./assets/svgStl-CNqzIoH_.js",
  "./assets/svgTrace.worker-DjE0Idw6.js",
  "./assets/word-editor-WGRT9z2I.js",
  "./assets/word-io-B3hDhtWH.js",
  "./assets/yjs-DbWgGxMD.js",
  "./assets/yjs-NKTEPdXN.js",
  "./assets/zip-runtime-ksjGVk9F.js",
  "./blueline/README.md",
  "./blueline/docs/ai-control.md",
  "./blueline/examples/agent-node.mjs",
  "./blueline/examples/embed.html",
  "./blueline/index.html",
  "./blueline/llms.txt",
  "./blueline/tools.json",
  "./pdf-assets/LICENSE.pdfjs",
  "./pdf-assets/cmaps/78-EUC-H.bcmap",
  "./pdf-assets/cmaps/78-EUC-V.bcmap",
  "./pdf-assets/cmaps/78-H.bcmap",
  "./pdf-assets/cmaps/78-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/78-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/78-V.bcmap",
  "./pdf-assets/cmaps/78ms-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/78ms-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/83pv-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/90ms-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/90ms-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/90msp-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/90msp-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/90pv-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/90pv-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/Add-H.bcmap",
  "./pdf-assets/cmaps/Add-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/Add-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/Add-V.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-0.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-1.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-2.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-3.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-4.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-5.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-6.bcmap",
  "./pdf-assets/cmaps/Adobe-CNS1-UCS2.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-0.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-1.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-2.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-3.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-4.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-5.bcmap",
  "./pdf-assets/cmaps/Adobe-GB1-UCS2.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-0.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-1.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-2.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-3.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-4.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-5.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-6.bcmap",
  "./pdf-assets/cmaps/Adobe-Japan1-UCS2.bcmap",
  "./pdf-assets/cmaps/Adobe-Korea1-0.bcmap",
  "./pdf-assets/cmaps/Adobe-Korea1-1.bcmap",
  "./pdf-assets/cmaps/Adobe-Korea1-2.bcmap",
  "./pdf-assets/cmaps/Adobe-Korea1-UCS2.bcmap",
  "./pdf-assets/cmaps/B5-H.bcmap",
  "./pdf-assets/cmaps/B5-V.bcmap",
  "./pdf-assets/cmaps/B5pc-H.bcmap",
  "./pdf-assets/cmaps/B5pc-V.bcmap",
  "./pdf-assets/cmaps/CNS-EUC-H.bcmap",
  "./pdf-assets/cmaps/CNS-EUC-V.bcmap",
  "./pdf-assets/cmaps/CNS1-H.bcmap",
  "./pdf-assets/cmaps/CNS1-V.bcmap",
  "./pdf-assets/cmaps/CNS2-H.bcmap",
  "./pdf-assets/cmaps/CNS2-V.bcmap",
  "./pdf-assets/cmaps/ETHK-B5-H.bcmap",
  "./pdf-assets/cmaps/ETHK-B5-V.bcmap",
  "./pdf-assets/cmaps/ETen-B5-H.bcmap",
  "./pdf-assets/cmaps/ETen-B5-V.bcmap",
  "./pdf-assets/cmaps/ETenms-B5-H.bcmap",
  "./pdf-assets/cmaps/ETenms-B5-V.bcmap",
  "./pdf-assets/cmaps/EUC-H.bcmap",
  "./pdf-assets/cmaps/EUC-V.bcmap",
  "./pdf-assets/cmaps/Ext-H.bcmap",
  "./pdf-assets/cmaps/Ext-RKSJ-H.bcmap",
  "./pdf-assets/cmaps/Ext-RKSJ-V.bcmap",
  "./pdf-assets/cmaps/Ext-V.bcmap",
  "./pdf-assets/cmaps/GB-EUC-H.bcmap",
  "./pdf-assets/cmaps/GB-EUC-V.bcmap",
  "./pdf-assets/cmaps/GB-H.bcmap",
  "./pdf-assets/cmaps/GB-V.bcmap",
  "./pdf-assets/cmaps/GBK-EUC-H.bcmap",
  "./pdf-assets/cmaps/GBK-EUC-V.bcmap",
  "./pdf-assets/cmaps/GBK2K-H.bcmap",
  "./pdf-assets/cmaps/GBK2K-V.bcmap",
  "./pdf-assets/cmaps/GBKp-EUC-H.bcmap",
  "./pdf-assets/cmaps/GBKp-EUC-V.bcmap",
  "./pdf-assets/cmaps/GBT-EUC-H.bcmap",
  "./pdf-assets/cmaps/GBT-EUC-V.bcmap",
  "./pdf-assets/cmaps/GBT-H.bcmap",
  "./pdf-assets/cmaps/GBT-V.bcmap",
  "./pdf-assets/cmaps/GBTpc-EUC-H.bcmap",
  "./pdf-assets/cmaps/GBTpc-EUC-V.bcmap",
  "./pdf-assets/cmaps/GBpc-EUC-H.bcmap",
  "./pdf-assets/cmaps/GBpc-EUC-V.bcmap",
  "./pdf-assets/cmaps/H.bcmap",
  "./pdf-assets/cmaps/HKdla-B5-H.bcmap",
  "./pdf-assets/cmaps/HKdla-B5-V.bcmap",
  "./pdf-assets/cmaps/HKdlb-B5-H.bcmap",
  "./pdf-assets/cmaps/HKdlb-B5-V.bcmap",
  "./pdf-assets/cmaps/HKgccs-B5-H.bcmap",
  "./pdf-assets/cmaps/HKgccs-B5-V.bcmap",
  "./pdf-assets/cmaps/HKm314-B5-H.bcmap",
  "./pdf-assets/cmaps/HKm314-B5-V.bcmap",
  "./pdf-assets/cmaps/HKm471-B5-H.bcmap",
  "./pdf-assets/cmaps/HKm471-B5-V.bcmap",
  "./pdf-assets/cmaps/HKscs-B5-H.bcmap",
  "./pdf-assets/cmaps/HKscs-B5-V.bcmap",
  "./pdf-assets/cmaps/Hankaku.bcmap",
  "./pdf-assets/cmaps/Hiragana.bcmap",
  "./pdf-assets/cmaps/KSC-EUC-H.bcmap",
  "./pdf-assets/cmaps/KSC-EUC-V.bcmap",
  "./pdf-assets/cmaps/KSC-H.bcmap",
  "./pdf-assets/cmaps/KSC-Johab-H.bcmap",
  "./pdf-assets/cmaps/KSC-Johab-V.bcmap",
  "./pdf-assets/cmaps/KSC-V.bcmap",
  "./pdf-assets/cmaps/KSCms-UHC-H.bcmap",
  "./pdf-assets/cmaps/KSCms-UHC-HW-H.bcmap",
  "./pdf-assets/cmaps/KSCms-UHC-HW-V.bcmap",
  "./pdf-assets/cmaps/KSCms-UHC-V.bcmap",
  "./pdf-assets/cmaps/KSCpc-EUC-H.bcmap",
  "./pdf-assets/cmaps/KSCpc-EUC-V.bcmap",
  "./pdf-assets/cmaps/Katakana.bcmap",
  "./pdf-assets/cmaps/LICENSE",
  "./pdf-assets/cmaps/NWP-H.bcmap",
  "./pdf-assets/cmaps/NWP-V.bcmap",
  "./pdf-assets/cmaps/RKSJ-H.bcmap",
  "./pdf-assets/cmaps/RKSJ-V.bcmap",
  "./pdf-assets/cmaps/Roman.bcmap",
  "./pdf-assets/cmaps/UniCNS-UCS2-H.bcmap",
  "./pdf-assets/cmaps/UniCNS-UCS2-V.bcmap",
  "./pdf-assets/cmaps/UniCNS-UTF16-H.bcmap",
  "./pdf-assets/cmaps/UniCNS-UTF16-V.bcmap",
  "./pdf-assets/cmaps/UniCNS-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniCNS-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniCNS-UTF8-H.bcmap",
  "./pdf-assets/cmaps/UniCNS-UTF8-V.bcmap",
  "./pdf-assets/cmaps/UniGB-UCS2-H.bcmap",
  "./pdf-assets/cmaps/UniGB-UCS2-V.bcmap",
  "./pdf-assets/cmaps/UniGB-UTF16-H.bcmap",
  "./pdf-assets/cmaps/UniGB-UTF16-V.bcmap",
  "./pdf-assets/cmaps/UniGB-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniGB-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniGB-UTF8-H.bcmap",
  "./pdf-assets/cmaps/UniGB-UTF8-V.bcmap",
  "./pdf-assets/cmaps/UniJIS-UCS2-H.bcmap",
  "./pdf-assets/cmaps/UniJIS-UCS2-HW-H.bcmap",
  "./pdf-assets/cmaps/UniJIS-UCS2-HW-V.bcmap",
  "./pdf-assets/cmaps/UniJIS-UCS2-V.bcmap",
  "./pdf-assets/cmaps/UniJIS-UTF16-H.bcmap",
  "./pdf-assets/cmaps/UniJIS-UTF16-V.bcmap",
  "./pdf-assets/cmaps/UniJIS-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniJIS-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniJIS-UTF8-H.bcmap",
  "./pdf-assets/cmaps/UniJIS-UTF8-V.bcmap",
  "./pdf-assets/cmaps/UniJIS2004-UTF16-H.bcmap",
  "./pdf-assets/cmaps/UniJIS2004-UTF16-V.bcmap",
  "./pdf-assets/cmaps/UniJIS2004-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniJIS2004-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniJIS2004-UTF8-H.bcmap",
  "./pdf-assets/cmaps/UniJIS2004-UTF8-V.bcmap",
  "./pdf-assets/cmaps/UniJISPro-UCS2-HW-V.bcmap",
  "./pdf-assets/cmaps/UniJISPro-UCS2-V.bcmap",
  "./pdf-assets/cmaps/UniJISPro-UTF8-V.bcmap",
  "./pdf-assets/cmaps/UniJISX0213-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniJISX0213-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniJISX02132004-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniJISX02132004-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniKS-UCS2-H.bcmap",
  "./pdf-assets/cmaps/UniKS-UCS2-V.bcmap",
  "./pdf-assets/cmaps/UniKS-UTF16-H.bcmap",
  "./pdf-assets/cmaps/UniKS-UTF16-V.bcmap",
  "./pdf-assets/cmaps/UniKS-UTF32-H.bcmap",
  "./pdf-assets/cmaps/UniKS-UTF32-V.bcmap",
  "./pdf-assets/cmaps/UniKS-UTF8-H.bcmap",
  "./pdf-assets/cmaps/UniKS-UTF8-V.bcmap",
  "./pdf-assets/cmaps/V.bcmap",
  "./pdf-assets/cmaps/WP-Symbol.bcmap",
  "./pdf-assets/iccs/CGATS001Compat-v2-micro.icc",
  "./pdf-assets/iccs/LICENSE",
  "./pdf-assets/standard_fonts/FoxitDingbats.pfb",
  "./pdf-assets/standard_fonts/FoxitFixed.pfb",
  "./pdf-assets/standard_fonts/FoxitFixedBold.pfb",
  "./pdf-assets/standard_fonts/FoxitFixedBoldItalic.pfb",
  "./pdf-assets/standard_fonts/FoxitFixedItalic.pfb",
  "./pdf-assets/standard_fonts/FoxitSerif.pfb",
  "./pdf-assets/standard_fonts/FoxitSerifBold.pfb",
  "./pdf-assets/standard_fonts/FoxitSerifBoldItalic.pfb",
  "./pdf-assets/standard_fonts/FoxitSerifItalic.pfb",
  "./pdf-assets/standard_fonts/FoxitSymbol.pfb",
  "./pdf-assets/standard_fonts/LICENSE_FOXIT",
  "./pdf-assets/standard_fonts/LICENSE_LIBERATION",
  "./pdf-assets/standard_fonts/LiberationSans-Bold.ttf",
  "./pdf-assets/standard_fonts/LiberationSans-BoldItalic.ttf",
  "./pdf-assets/standard_fonts/LiberationSans-Italic.ttf",
  "./pdf-assets/standard_fonts/LiberationSans-Regular.ttf",
  "./pdf-assets/wasm/LICENSE_JBIG2",
  "./pdf-assets/wasm/LICENSE_OPENJPEG",
  "./pdf-assets/wasm/LICENSE_PDFJS_JBIG2",
  "./pdf-assets/wasm/LICENSE_PDFJS_OPENJPEG",
  "./pdf-assets/wasm/LICENSE_PDFJS_QCMS",
  "./pdf-assets/wasm/LICENSE_QCMS",
  "./pdf-assets/wasm/jbig2.wasm",
  "./pdf-assets/wasm/jbig2_nowasm_fallback.js",
  "./pdf-assets/wasm/openjpeg.wasm",
  "./pdf-assets/wasm/openjpeg_nowasm_fallback.js",
  "./pdf-assets/wasm/qcms_bg.wasm",
  "./pdf-assets/wasm/quickjs-eval.js",
  "./pdf-assets/wasm/quickjs-eval.wasm"
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

  // Blueline is a separate HTML editor. Never answer its navigation with the
  // React shell. Local-file query parameters share the same cached editor.
  const designDirectory = new URL('blueline/', self.location.href);
  if (url.pathname.startsWith(designDirectory.pathname)) {
    const designIndex = new URL('index.html', designDirectory);
    const target = url.pathname === designDirectory.pathname || url.pathname === designIndex.pathname
      ? designIndex.href : request;
    event.respondWith(cacheFirst(target, RUNTIME_CACHE));
    return;
  }

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
