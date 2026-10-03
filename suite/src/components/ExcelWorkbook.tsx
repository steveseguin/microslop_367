import type React from 'react';
import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import type { WorkbookInstance } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';

/**
 * Curated subset of fortune-sheet's built-in toolbar.
 *
 * The grid already ships correct, round-trippable implementations of every number
 * format (currency / percent / date / decimals / thousands separator) plus fill,
 * borders, alignment, merge and wrap. Re-implementing those in the app toolbar would
 * mean re-implementing fortune-sheet's `ct` (cell-type/format) model and its number
 * parser, which is a large new bug surface for a purely cosmetic gain. So the built-in
 * toolbar is switched on and cut down to the formatting-only items; everything
 * document-level (undo/redo, sheets, freeze, sort, insert/delete, find, chart,
 * import/export) stays in the app's own toolbar so the two do not overlap.
 *
 * RE-CONFIRMED against the library source when the "two stacked toolbars" question was
 * reopened, because the obvious alternative -- `showToolbar={false}` and own the
 * formatting ourselves -- is not available:
 *
 *  - The real format model is `toolbarItemClickHandler(name)(ctx, cellInput)` ->
 *    `updateFormat` -> `updateFormatCell`. It needs an immer draft of the library's
 *    internal `Context` plus its `cellInput` DOM node. `WorkbookInstance` exposes
 *    neither, and `batchCallApis` only dispatches to the named public APIs.
 *  - The public `setCellFormat` is a strictly WEAKER path for `ct`: it throws unless the
 *    caller supplies `ct.t` itself (so we would re-implement the `is_date()` / `@` /
 *    `General` -> d/s/n/g inference), and it omits `if (fa !== '@' && isRealNum(v)) v =
 *    Number(v)` -- the numeric coercion whose absence already forced the
 *    `applyPendingCurrencyFormat` workaround in Excel.tsx and without which SUM silently
 *    ignores currency cells.
 *  - `number-increase` / `number-decrease` are ~60 lines each of format-mask surgery over
 *    `genarate()`. That is precisely the bug surface this comment was written to avoid.
 *
 * Verified live: a mouse click on their currency button turns B2 into
 * `{v: 42, m: "$ 42.00", ct: {fa: "$ #.00", t: "n"}}` -- value coerced, mask applied,
 * type inferred. Nothing reachable from outside reproduces that.
 */
const SPREADSHEET_TOOLBAR_ITEMS = [
  'format-painter',
  'clear-format',
  '|',
  'currency-format',
  'percentage-format',
  'number-decrease',
  'number-increase',
  'format',
  '|',
  'font-size',
  'bold',
  'italic',
  'underline',
  '|',
  'font-color',
  'background',
  'border',
  '|',
  'horizontal-align',
  'vertical-align',
  'text-wrap',
  'merge-cell',
  '|',
  'filter',
];

/** Arrow keys move within the toolbar once it is a single tab stop. */
const TOOLBAR_ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];

const isToolbarControl = (node: Element | null): node is HTMLElement =>
  node instanceof HTMLElement && node.getAttribute('role') === 'button';

/**
 * Make fortune-sheet's toolbar usable from a keyboard.
 *
 * Every control the library renders -- its own `Button`s and its `Combo` triggers alike --
 * is a `<div role="button" tabIndex={0}>` carrying ONLY an `onClick`. A div does not
 * synthesise a click from Enter or Space the way a real `<button>` does, so the entire
 * formatting toolbar is mouse-and-touch-only. Measured, not assumed: focusing "Format as
 * currency" and pressing Enter and then Space leaves the cell at `{v: 38, m: "38"}`, while
 * a mouse click on the same element produces `{v: 42, m: "$ 42.00", ct: {...}}`. That is a
 * WCAG 2.1.1 failure across all 19 controls.
 *
 * It is also 29 tab stops. Reaching the grid from the file name meant crossing every one
 * of them, none of which does anything -- the same defect the app's own Toolbar fixed with
 * a roving tabindex.
 *
 * Both are repaired here rather than in a fork: a keydown bridge that turns Enter/Space
 * into the click the library is already listening for, and a roving tabindex that collapses
 * the row to one tab stop. The library's own handlers still do all the work, so the `ct`
 * model is untouched.
 */
function useAccessibleFortuneToolbar(shellRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const toolbarOf = () => shell.querySelector<HTMLElement>('.fortune-toolbar');

    /** Every `role="button"` in the row, including the wrappers that hold no label. */
    const allControlsOf = (toolbar: HTMLElement) => [
      ...toolbar.querySelectorAll<HTMLElement>('[role="button"]'),
    ];

    /*
     * A `Combo` (font size, colours, borders, align, wrap, merge, filter) is a
     * `role="button"` CONTAINER wrapping two more `role="button"` halves -- the control
     * itself and its dropdown arrow -- and only the halves carry an `aria-label`. Roving
     * over the containers parked focus on an element with no accessible name, so
     * navigation walks the leaves and the containers are merely silenced.
     */
    const navControlsOf = (toolbar: HTMLElement) =>
      allControlsOf(toolbar).filter(
        (node) => node.offsetParent !== null && !node.querySelector('[role="button"]'),
      );

    /*
     * The library re-renders this row on every selection change and re-asserts
     * `tabIndex={0}` on each control, so roving has to be re-applied rather than set once.
     * Only ever writes a value that is already wrong, which is what keeps the
     * MutationObserver below from feeding itself.
     */
    const syncRovingTabIndex = () => {
      const toolbar = toolbarOf();
      if (!toolbar) {
        return;
      }

      const navControls = navControlsOf(toolbar);
      if (navControls.length === 0) {
        return;
      }

      const active = document.activeElement;
      const current =
        navControls.find((node) => node === active) ??
        navControls.find((node) => node.tabIndex === 0) ??
        navControls[0];

      // Every wrapper is silenced too, or the containers would keep their own tab stops.
      for (const node of allControlsOf(toolbar)) {
        const wanted = node === current ? 0 : -1;
        if (node.tabIndex !== wanted) {
          node.tabIndex = wanted;
        }
      }
    };

    /*
     * fortune-sheet builds a Combo's accessible name as `${label}: ${valueLabel}`, and
     * `valueLabel` is not always translated or even present. Measured in this build:
     * `aria-label="Border: 边框设置"` and `aria-label="Merge cells: 合并单元格"` announce
     * untranslated Chinese to an English screen reader, and six more ("Font color: ",
     * "Fill color: ", "Horizontal align: ", "Vertical align: ", "Text wrap: ", "Sort and
     * filter: ") announce a dangling separator with nothing after it.
     *
     * Only those two shapes are rewritten, down to the label alone. A value that is real
     * and translated ("Format: Automatic", "Font size: 10", "Border: Dropdown") carries
     * genuine state and is left exactly as the library wrote it. CSS cannot do this: an
     * accessible name is not a stylable property.
     */
    const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;

    const syncAccessibleNames = (toolbar: HTMLElement) => {
      for (const node of allControlsOf(toolbar)) {
        const label = node.getAttribute('aria-label');
        const parts = label ? /^(.*?):\s*(.*)$/.exec(label) : null;
        if (!parts) {
          continue;
        }

        const [, name, value] = parts;
        if (name && (value === '' || CJK.test(value))) {
          node.setAttribute('aria-label', name);
        }
      }
    };

    /*
     * The library's toggle buttons announce nothing when they are ON. Its `Button` renders
     * `style={selected ? { backgroundColor: '#E7E5EB' } : {}}` — colour is the ONLY signal,
     * which is both a WCAG 1.4.1 and a 4.1.2 failure.
     *
     * `aria-pressed` is applied to exactly the four items the library can ever mark
     * selected (`selectedMap` in @fortune-sheet/core: bold, italic, underline,
     * strike-through). Putting it on the others would be a lie in the opposite direction —
     * "Clear format, not pressed" is not a toggle at all. They are matched on the icon's
     * `<use href="#name">`, which is the library's internal item id: stable, and unlike the
     * tooltip not affected by locale.
     */
    const TOGGLE_ICON_IDS = ['#bold', '#italic', '#underline', '#strike-through'];

    const syncPressedState = (toolbar: HTMLElement) => {
      for (const node of toolbar.querySelectorAll<HTMLElement>('.fortune-toolbar-button[role="button"]')) {
        const iconId = node.querySelector('svg use')?.getAttribute('xlink:href') ?? node.querySelector('svg use')?.getAttribute('href');
        if (!iconId || !TOGGLE_ICON_IDS.includes(iconId)) {
          continue;
        }

        // An inline backgroundColor is set by nothing else on these buttons, so it is a
        // faithful read of `selected` without hard-coding the library's hex value.
        const pressed = node.style.backgroundColor !== '' ? 'true' : 'false';
        if (node.getAttribute('aria-pressed') !== pressed) {
          node.setAttribute('aria-pressed', pressed);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element | null;
      const control = target?.closest<HTMLElement>('.fortune-toolbar [role="button"]') ?? null;
      if (!isToolbarControl(control)) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        /*
         * Space would otherwise scroll the page, and the library's popovers close on the
         * next outside pointerdown -- dispatching the click it already binds is the whole
         * fix, and it keeps every handler and every side effect the mouse path has.
         *
         * `stopPropagation` because the grid binds its own document-level key handling:
         * Enter means "move the selection down" there, and letting it through moved the
         * cell cursor every time a toolbar control was activated.
         */
        event.preventDefault();
        event.stopPropagation();
        control.click();
        return;
      }

      if (!TOOLBAR_ARROW_KEYS.includes(event.key)) {
        return;
      }

      const toolbar = toolbarOf();
      if (!toolbar) {
        return;
      }

      const navControls = navControlsOf(toolbar);
      const index = navControls.indexOf(control);
      if (index < 0) {
        return;
      }

      let next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        next = (index + 1) % navControls.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        next = (index - 1 + navControls.length) % navControls.length;
      } else if (event.key === 'Home') {
        next = 0;
      } else {
        next = navControls.length - 1;
      }

      /*
       * Arrow keys scroll the SELECTION in the grid, and that handler is bound on
       * document, so it runs after this one and pulled focus straight back out of the
       * toolbar. Measured: without `stopPropagation` every arrow press left
       * `document.activeElement` on the cell input with no accessible name.
       */
      event.preventDefault();
      event.stopPropagation();
      navControls[next].focus();
      syncRovingTabIndex();
    };

    const syncToolbar = () => {
      const toolbar = toolbarOf();
      if (!toolbar) {
        return;
      }

      syncAccessibleNames(toolbar);
      syncPressedState(toolbar);
      syncRovingTabIndex();
    };

    let frame = 0;
    const scheduleSync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(syncToolbar);
    };

    shell.addEventListener('keydown', handleKeyDown);
    shell.addEventListener('focusin', scheduleSync);

    /*
     * `style` is watched as well as `tabindex` because the selected state of a toggle
     * button IS an inline style: React updates that attribute in place on the existing
     * node, which produces no childList record, so without it `aria-pressed` would go
     * stale the moment bold was switched on. Nothing here ever writes `style` or
     * `tabindex` unless it is already wrong, so the observer cannot feed itself.
     */
    const observer = new MutationObserver(scheduleSync);
    observer.observe(shell, { childList: true, subtree: true, attributeFilter: ['tabindex', 'style'] });
    scheduleSync();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      shell.removeEventListener('keydown', handleKeyDown);
      shell.removeEventListener('focusin', scheduleSync);
    };
  }, [shellRef]);
}

interface ExcelWorkbookProps {
  data: unknown[];
  onChange?: (nextData: unknown[]) => void;
  onOp?: (operation: unknown) => void;
  hooks?: Record<string, (...args: unknown[]) => void>;
  onReady?: (instance: WorkbookInstance | null) => void;
}

const ExcelWorkbook = forwardRef<WorkbookInstance, ExcelWorkbookProps>(function ExcelWorkbook(
  { data, onChange, onOp, hooks, onReady },
  ref,
) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useAccessibleFortuneToolbar(shellRef);

  const handleRef = useCallback(
    (instance: WorkbookInstance | null) => {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }

      onReady?.(instance);
    },
    [onReady, ref],
  );

  /**
   * fortune-sheet measures its canvas once on mount and afterwards only re-measures on
   * a window `resize` event. On narrow viewports the sheet pane frequently has not
   * settled to its final height at that moment, so the grid latches a height of 0 and
   * stays invisible forever. With no visible grid there is nothing to tap, the
   * selection never leaves its default, and edits land on A1.
   *
   * Observing our own shell and replaying a `resize` makes the grid re-measure whenever
   * the pane actually gets its height, which is the real fix for the "cannot select a
   * cell on mobile" report.
   */
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || typeof ResizeObserver === 'undefined') {
      return;
    }

    let lastWidth = -1;
    let lastHeight = -1;
    let frame = 0;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      if (Math.round(width) === lastWidth && Math.round(height) === lastHeight) {
        return;
      }

      lastWidth = Math.round(width);
      lastHeight = Math.round(height);

      if (width <= 0 || height <= 0) {
        return;
      }

      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });

    observer.observe(shell);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={shellRef} style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Workbook
        ref={handleRef}
        data={data as never}
        showToolbar
        toolbarItems={SPREADSHEET_TOOLBAR_ITEMS}
        currency="$"
        showFormulaBar={false}
        showSheetTabs
        onChange={onChange ? (nextData) => onChange(nextData as unknown[]) : undefined}
        onOp={onOp}
        hooks={hooks}
      />
    </div>
  );
});

export type { WorkbookInstance };
export default ExcelWorkbook;
