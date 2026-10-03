# OfficeNinja / Microslop 367

A browser workspace for NinjaWord documents, NinjaCalc spreadsheets, NinjaSlides presentations, and Blueline vector designs and prototypes. Files save locally; no account is required.

## Development

From `suite/`, run `npm ci` and `npm run dev`. The React suite uses Vite and hash routes. Blueline is served at `blueline/` as its own self-contained editor, with a shared theme and suite navigation. Its source and integration notes are in [`blueline/README.md`](blueline/README.md).

Both `npm run dev` and `npm run build` first build Blueline into `suite/public/blueline/`. That directory is generated and ignored. Edit `blueline/src/`, not the generated copies.

## Publishing

Run `npm run build:pages` from `suite/`. This builds the complete application and copies it into the tracked `docs/` directory, preserving `docs/CNAME`. Commit the source and generated `docs/` changes together. GitHub Pages serves `docs/` on the default branch.

The active suite is `suite/` and its published output is `docs/`. The optional root HTTPS server serves `suite/dist/` and requires local certificates. The root service worker is a compatibility tombstone for legacy clients.

## Verification

From `suite/`, run `npm run test:typecheck`, `npm run lint`, and `npm test`. Playwright builds the production app and starts its own server, with one worker. Use `PLAYWRIGHT_BASE_URL` only to target another local production build. See `suite/tests/README.md` for the complete test contract.

Blueline integration tests capture desktop/mobile screenshots in both themes under the ignored `suite/test-results/` directory. Offline navigation is tested with a real service worker; the editor is cached separately from the React shell. External fonts, paper.js, and optional remote collaboration still need their network dependencies.

Blueline keeps its native `blueline` IndexedDB store. The workspace lists and deletes designs directly from that store; existing office document storage is unchanged. Local file links work only in the browser containing those files. Export files to back them up or move them between devices. Optional collaboration and AI transports require the user to connect; they are not enabled by suite integration.

Search metadata, structured data, the install manifest, `robots.txt`, and `sitemap.xml` are maintained in `suite/index.html`, `suite/public/`, and `blueline/src/head.html`. Only actual public pages are included in the sitemap; local-file identifiers and hash routes are not separate search pages.
