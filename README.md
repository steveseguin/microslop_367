# OfficeNinja / Microslop 367

A browser workspace for NinjaWord documents, NinjaCalc spreadsheets, NinjaSlides presentations, and Blueline vector designs and prototypes. Files save locally; no account is required.

## Development

From `suite/`, run `npm ci` and `npm run dev`. The React suite uses Vite and hash routes. Blueline is served at `blueline/` as its own self-contained editor, with a shared theme and suite navigation. Its source and integration notes are in [`blueline/README.md`](blueline/README.md).

Both `npm run dev` and `npm run build` first build Blueline into `suite/public/blueline/`. That directory is generated and ignored. Edit `blueline/src/`, not the generated copies.

## Publishing

Run `npm run build:pages` from `suite/`. This builds the complete application and copies it into the tracked `docs/` directory, preserving `docs/CNAME`. Commit the source and generated `docs/` changes together. GitHub Pages serves `docs/` on the default branch.

The root HTML files and `public/` directory are legacy implementations; the active suite is `suite/` and its published output is `docs/`. The optional root HTTPS server serves `suite/dist/` and requires local certificates.

## Verification

Run `npm run build`, then `npm run preview` in one terminal. In another, from `suite/`:

```sh
npx playwright test tests/blueline-integration.spec.ts tests/performance-accessibility.spec.ts tests/persistence-dnd.spec.ts tests/word-robustness.spec.ts --workers=1
```

Tests default to `http://127.0.0.1:4173`; set `BASE_URL` to check another local build. Integration tests capture desktop/mobile screenshots in both themes under the ignored `suite/test-results/` directory. Some older test files still target the optional HTTPS server and historical controls.

Blueline keeps its native `blueline` IndexedDB store. The workspace lists and deletes designs directly from that store; existing office document storage is unchanged. Local file links work only in the browser containing those files. Export files to back them up or move them between devices. Optional collaboration and AI transports require the user to connect; they are not enabled by suite integration.

Search metadata, structured data, the install manifest, `robots.txt`, and `sitemap.xml` are maintained in `suite/index.html`, `suite/public/`, and `blueline/src/head.html`. Only actual public pages are included in the sitemap; local-file identifiers and hash routes are not separate search pages.
