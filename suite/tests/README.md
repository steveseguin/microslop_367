# OfficeNinja Suite — end-to-end tests

Playwright tests for the React app in `suite/`. This file is the whole story: how to run
them, what they actually check, what they deliberately do **not** check, and the product
bugs they currently document.

---

## Running

```bash
cd suite
npm ci
npx playwright install --with-deps chromium   # or: npm run test:install
npm test
```

`npm test` is self-contained. It runs `vite build`, starts `vite preview` on
`http://127.0.0.1:4173`, runs every spec against that server, and shuts it down. There is
nothing to start by hand and nothing to configure.

| script | what it does |
| --- | --- |
| `npm test` | full suite, headless |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:headed` | watch it drive a real browser |
| `npm run test:debug` | step through with the inspector |
| `npm run test:report` | open the last HTML report |
| `npm run test:install` | install the Chromium browser Playwright needs |
| `npm run test:typecheck` | type-check the specs (`npm run build` only covers `src/`) |

Useful environment variables:

- `PLAYWRIGHT_BASE_URL=http://host:port` — point the suite at a server you manage. The
  built-in `webServer` is then skipped entirely.
- `PLAYWRIGHT_REUSE_SERVER=1` — reuse a `vite preview` you already have on port 4173.
  Faster, but **you** are then responsible for keeping it in step with `npm run build`.

### Why the suite runs against a production build, not the dev server

Whichever server happens to be listening decides what "passing" means. The previous config
had no `baseURL` and no `webServer`, and the result was that 33 of 38 tests died on
`ERR_CONNECTION_REFUSED` while the run still looked like it had told you something.

Running against `vite build` + `vite preview` fixes that and buys three things:

1. bundle and code-splitting assertions (`production-build.spec.ts`) are meaningful,
   because the chunks they name actually exist;
2. the minified, tree-shaken code is what gets exercised;
3. `import.meta.env.DEV` escape hatches are absent. In particular the app exposes
   `window.__excelWorkbook` in dev only, so the tests cannot reach into the spreadsheet
   engine and must read state back the way a user would — or straight out of IndexedDB.
   Both are real assertions. A dev-only global is not.

---

## Three rules that this repo keeps getting wrong

These are encoded in `tests/helpers/app.ts`. Use the helpers rather than rediscovering
them.

1. **The app uses `HashRouter`.** Routes are `/#/word`, `/#/excel`, `/#/powerpoint`, `/#/`.
   A bare `/word` silently renders the Dashboard — it does not 404, and it does not render
   the editor. Two earlier audits reached opposite conclusions about whether features
   existed because of this. Navigate with `openWord` / `openExcel` / `openSlides`.
   `persistence.spec.ts` pins the behaviour so it stays discovered.

2. **`page.goto()` to a URL that differs only in the hash does NOT reload the document.**
   Any "did it persist?" assertion must use `reloadEditor()`, which performs a real
   `page.reload()`. A `goto` with a new hash is a client-side route change and proves
   nothing about storage.

3. **fortune-sheet renders cells to `<canvas>`.** `innerText` cannot see a cell value.
   `tests/helpers/excel.ts` reads values back through the formula bar, the selection
   summary panel, or IndexedDB, and drives the grid with the keyboard (one click to anchor
   on A1, then arrow keys, each move verified against `.formula-coordinate`).

A fourth, less obvious one: **the save-status pill is not proof of persistence.** It reads
`Saved` as the *initial* state of a new spreadsheet and a new deck, so asserting on it
would pass against an app that never wrote anything. The oracle for persistence is
`expectStored()`, which polls IndexedDB.

---

## What is covered

| spec | covers |
| --- | --- |
| `persistence.spec.ts` | Word / Excel / Slides content reaching IndexedDB and surviving a real reload; autosave flush when leaving mid-debounce; embedded images; workbook import; Dashboard rename not disturbing the body; revisions advancing; HashRouter routing |
| `excel-data.spec.ts` | undo / redo; sort ascending and descending moving whole rows; freeze and unfreeze panes; cross-sheet formulas; selection summary arithmetic; charting a 620-row sheet (truncation, not a hang); find-and-replace-all; adding sheets; formula-bar writes landing on the selected cell rather than A1 |
| `word-editing.spec.ts` | find and replace including overlapping candidates and match-case; tables (insert, grow, delete, persistence, control enablement); DOCX export **including `word/media/`**; DOCX import behind a confirm; URL image embedding; blank-title fallback |
| `slides.spec.ts` | slide order as persisted; reorder by arrow button, by `Alt+Arrow`, and by pointer drag; delete behind a confirm; last-slide protection; duplicate independence; image drop; status-bar slide tracking; full-screen presentation keyboard nav; PPTX round trip |
| `dashboard.spec.ts` | delete + undo restoring content byte-for-byte; delete staying deleted across a reload; two independent undo entries; a 120-file corpus paginating, expanding, searching, sorting; opening the right document from a long list; empty state |
| `cross-tab.spec.ts` | real `BroadcastChannel` notification between two tabs of one context; Word and Excel conflict detection with proof that the winner was **not** overwritten; a second tab loading saved content |
| `storage-resilience.spec.ts` | localStorage blocked; IndexedDB blocked; **both** blocked (must report `Save failed`, never `Saved`); Dashboard and theme toggle surviving no storage |
| `accessibility.spec.ts` | skip link; keyboard-only path from Dashboard into an editor; the ribbon as a single tab stop with arrow-key roving; `Escape` closing find; slide cards activating from the keyboard; destructive dialogs focusing *Cancel*; mobile ribbon as a real modal; mobile switcher ARIA; no horizontal overflow on a phone |
| `production-build.spec.ts` | that the suite really is testing a build and not a dev server; the Dashboard neither preloading nor downloading heavy editor chunks; each editor pulling only its own engine chunk; every route booting with no uncaught error and no failed request |

Every test sets up and tears down its own document id, so specs are order-independent.
Documents are addressed by a unique id per test (`makeId`), and browser storage is
per-context, so nothing leaks between tests.

### Known product bugs

**BUG-1 — a formula-bar edit does not recalculate dependent formulas.**

Encoded as an expected failure in `persistence.spec.ts`
("Excel recalculates a formula when a precedent is edited via the formula bar"), annotated
with `test.fail()`. The suite therefore stays green, and the day the bug is fixed that test
reports an **unexpected pass**, which is the signal to delete the annotation.

Repro:

1. Open `/#/excel?id=demo`.
2. Select `B6`, type `=SUM(B2:B4)` into the formula bar, press Enter → `B6` shows `97`. ✅
3. Select `B2`, type `142` into the **formula bar**, press Enter.
4. `B6` still shows `97`. Expected `197`.
5. The stale `97` is autosaved and still `97` after a reload.

Making the same edit **directly in the grid** (select `B2`, type, Enter) recalculates
correctly — that path is covered by a normal passing test. The difference is that the
formula-bar path goes through `workbook.setCellValue` in `applyFormulaValue`
(`src/pages/Excel.tsx`), which writes the value without triggering fortune-sheet's
dependency recalculation. Excel's find-and-replace uses the same call, so replacing text in
a cell that other formulas depend on will have the same staleness.

No fix was applied — `src/` is owned elsewhere.

---

## What is NOT covered

Stated plainly, because a gap you know about is cheaper than one you discover in
production.

**Browsers and platforms**
- Chromium only. No Firefox, no WebKit/Safari, no real iOS or Android device. The "mobile"
  tests are a Chromium window with an iPhone 14 viewport, user agent and touch flags — they
  catch layout and ARIA regressions, not engine-specific ones.
- No visual regression testing. Nothing here would notice the app turning bright pink.
- Dark mode is only exercised to the extent that the theme toggle must not throw.

**Spreadsheet**
- **Filtering** is fortune-sheet's own toolbar UI and is untested.
- Cell formatting (currency, percent, decimals, borders, merge, wrap) is untested; it is
  fortune-sheet's built-in toolbar, and the app deliberately does not reimplement it.
- Only `SUM` and a cross-sheet `SUM` are exercised. The wider formula library, circular
  references, and error values (`#NAME?`, `#REF!`) are untested.
- Very large workbooks are covered only at 620 rows, and only for charting. There is no
  performance budget or timing assertion anywhere in this suite.
- The "refuse to autosave an empty grid over a workbook that had content" guard in
  `performSave` is not covered — there is no reliable way to drive the grid into that state
  from the outside.
- One test (`the selection summary computes ...`) drags a range using measured grid
  metrics. It does not assume which range it gets: it reads the resulting label back and
  checks the reported statistics against the seed data. If the grid metrics change it will
  select a different range and still pass, but a failure message mentioning an unexpected
  range label means the geometry moved.

**Word**
- Dictation and read-aloud (Web Speech) are untested; they need real speech APIs.
- Fonts, colours, text alignment and list nesting are untested beyond the fact that the
  controls exist and the ribbon is navigable.
- DOCX export is checked for text, an image part and a drawing element — not for
  fidelity of styling, numbering, or table layout in a real Word client.
- Print / page layout is untested.

**Slides**
- Object-level canvas manipulation (moving, resizing, rotating a shape with the mouse) is
  untested. Only add / duplicate / delete / drop and z-order button state are covered.
- PPTX import is checked for "the deck was replaced", not for fidelity of the imported
  content.
- Thumbnail *image quality* is not asserted, only that slides persist.
- Real fullscreen (`requestFullscreen`) is not exercised; the presentation overlay is.

**Persistence**
- No quota-exhaustion test. `BACKUP_SIZE_LIMIT_BYTES` and the oversized-document path in
  `writeBackup` are untested.
- The `document-deleted` / `allowResurrect` path in `db.ts` is not reachable from any page
  today, so it is untested at the UI level.
- Database schema recovery (`VersionError`, a missing index, a wrong `keyPath`) is
  untested; those paths in `db.ts` would need a corrupted database to reach.
- `subscribeToDocumentDeletion` is not wired into any page, so cross-tab *deletion*
  notification is untested.

**General**
- No unit tests. Everything here is end-to-end; pure functions in `db.ts` and `Excel.tsx`
  (`normalizeFormulaText`, `escapeCsvField`, `toHalfPoints`, …) have no direct coverage.
- No automated accessibility audit (axe or similar). The a11y tests check specific,
  hand-picked behaviours, not conformance.
- No security testing. The CSV formula-injection guard (`neutralizeCsvField`) is untested.
- CSV export is untested.
- No CI workflow exists in this repository, so nothing runs these tests automatically.

---

## Conventions for adding tests

- Prefer `getByRole` / `getByLabel` over CSS classes and `title` attributes. The app source
  is actively changing; the previous suite failed on eleven rotten selectors such as
  `.canvas-wrapper canvas` (a class that does not exist) and `button[title="Insert Image"]`
  (the real title is `Insert image`). Accessible names survive markup churn.
- Where a user-visible string is genuinely in flux, match it loosely but keep the assertion
  precise about the *fact* — see `expectMatchCount` in `word-editing.spec.ts`, which accepts
  both "3 results" and "1 of 3" but insists on the number 3.
- No `waitForTimeout` as a substitute for a real wait condition. Use `expect(...)`
  auto-retry, `expect.poll`, or `expectStored`.
- Every test must be able to fail. A test whose body cannot produce a failure is worse than
  no test: the suite this one replaced contained five that passed unconditionally, and one
  that asserted `expect(0).toBeGreaterThan(0)`.
