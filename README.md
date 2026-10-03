# OfficeNinja / Microslop 367

A browser workspace for NinjaWord documents, NinjaCalc spreadsheets, NinjaSlides presentations, Blueline vector designs, NinjaTime tracking and invoices, NinjaNotes with dictation, and NinjaPDF editing. Files save locally; no account is required.

## Development

Use Node.js 22.13 or newer in the 22.x line, or Node.js 24+. From `suite/`, run `npm ci` and `npm run dev`. The React suite uses Vite and hash routes. Blueline is served at `blueline/` as its own self-contained editor, with a shared theme and suite navigation. Its source and integration notes are in [`blueline/README.md`](blueline/README.md).

Both `npm run dev` and `npm run build` first build Blueline into `suite/public/blueline/`. That directory is generated and ignored. Edit `blueline/src/`, not the generated copies.

The same scripts stage PDF.js fonts, character maps, and image decoders in the generated `suite/public/pdf-assets/` directory. These resources and the PDF worker are hosted locally, with no external PDF processing service. PDF engines are lazy-loaded and excluded from the service worker's initial installation budget.

## Productivity tools

- `/#/time`: persistent timers, editable manual entries, clients/projects, billable flags, CSV export, JSON backup/restore, and invoices from selected entries for one client. Invoice lines are snapshots; invoiced entries cannot be edited or billed twice. Totals round each line to the currency's minor unit, subtract the discount, then apply the user-entered tax percentage. Invoice numbering, dates, business/client details, payment notes, and paid status are editable. Print / Save PDF uses the browser print dialog and a dedicated invoice layout.
- `/#/notes`: typed notes and timestamped dictated passages, date grouping, capture/edit ordering, search, tags, project/client context, pinning, delete/undo, Markdown export, and JSON backup/import. Import adds copies without replacing existing notes. Dictation defaults to on-device recognition when the browser and language pack support it; online browser recognition requires explicit consent. The app does not store audio. Typing works without speech support.
- `/#/pdf`: one autosaved working draft, page preview/navigation, rotation/reordering/deletion, merge and page extraction, text/image overlays, drawn marks/signatures, highlighting, and standard AcroForm fields. Download preserves editable fields unless the user explicitly flattens them. Extraction/deletion of form pages and importing forms into a merge require explicit flattening first. Existing paragraph text, OCR, redaction, cryptographic signatures, encrypted PDFs, and XFA forms are not supported. Added text uses standard Latin fonts; image overlays can contain other scripts. Files are limited to 30 MB; the last five PDF edits can be undone during the session.

The three workspaces use a separate `officeninja-tools` IndexedDB database, retaining existing office and Blueline storage formats. Writes compare revisions inside a transaction: a stale tab cannot overwrite newer work. If saving fails or another tab wins, editing stops and local work remains exportable. Reload after exporting to load the saved version. Local storage is not a cloud backup; use the provided exports before clearing browser data or changing devices. Browser storage quotas apply, and cross-device collaboration is not included.

After the app and its resources have loaded online, the service worker supports offline editing. Online dictation and downloading an on-device speech language pack still require a connection.

## Publishing

Run `npm run build:pages` from `suite/`. This builds the complete application and copies it into the tracked `docs/` directory, preserving `docs/CNAME`. Commit the source and generated `docs/` changes together. GitHub Pages serves `docs/` on the default branch.

The active suite is `suite/` and its published output is `docs/`. The optional root HTTPS server serves `suite/dist/` and requires local certificates. The root service worker is a compatibility tombstone for legacy clients.

## Verification

From `suite/`, run `npm run test:typecheck`, `npm run lint`, and `npm test`. Playwright builds the production app and starts its own server, with one worker. Use `PLAYWRIGHT_BASE_URL` only to target another local production build. See `suite/tests/README.md` for the complete test contract.

Blueline integration tests capture desktop/mobile screenshots in both themes under the ignored `suite/test-results/` directory. Offline navigation is tested with a real service worker; the editor is cached separately from the React shell. External fonts, paper.js, and optional remote collaboration still need their network dependencies.

Blueline keeps its native `blueline` IndexedDB store. The workspace lists and deletes designs directly from that store; existing office document storage is unchanged. Local file links work only in the browser containing those files. Export files to back them up or move them between devices. Optional collaboration and AI transports require the user to connect; they are not enabled by suite integration.

Search metadata, structured data, the install manifest, `robots.txt`, and `sitemap.xml` are maintained in `suite/index.html`, `suite/public/`, and `blueline/src/head.html`. Only actual public pages are included in the sitemap; local-file identifiers and hash routes are not separate search pages.
