/**
 * Keeps a plain text field and a shared Y.Text in step, so two people can type
 * in the same field at once. Local edits are applied as minimal splices; remote
 * edits update the field and keep the caret where the person left it.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type * as Y from 'yjs';

const LOCAL = Symbol('local-text');

/** Replace the differing middle of `ytext` so it reads `next`. */
function applyDiff(ytext: Y.Text, next: string) {
  const prev = ytext.toString();
  if (prev === next) return;
  let start = 0;
  const max = Math.min(prev.length, next.length);
  while (start < max && prev[start] === next[start]) start++;
  let end = 0;
  while (end < max - start && prev[prev.length - 1 - end] === next[next.length - 1 - end]) end++;
  const removed = prev.length - start - end;
  if (removed) ytext.delete(start, removed);
  const inserted = next.slice(start, next.length - end);
  if (inserted) ytext.insert(start, inserted);
}

/** Move a caret index through a Y.Text change (positions count in the old text). */
function shift(index: number, delta: { retain?: number; insert?: unknown; delete?: number }[]) {
  let pos = 0;
  let result = index;
  for (const op of delta) {
    if (pos > index) break;
    if (op.retain) pos += op.retain;
    else if (typeof op.insert === 'string') result += op.insert.length;
    else if (op.delete) {
      result -= Math.min(op.delete, index - pos);
      pos += op.delete;
    }
  }
  return Math.max(0, result);
}

/**
 * Returns `typed(next)`: call it from the field's onChange (before updating your
 * own state) so a keystroke reaches the shared text at once, never racing a
 * remote edit. Other changes to `value` (buttons, dictation) are picked up too.
 */
export function useYText(
  ytext: Y.Text | null,
  value: string,
  setValue: (next: string) => void,
  field: RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
) {
  const setRef = useRef(setValue);
  useLayoutEffect(() => {
    setRef.current = setValue;
  });

  // Values that came from typing or from the others. Those are already shared, and
  // replaying one late would undo whatever arrived since.
  const known = useRef(new Set<string>());
  const remember = (text: string) => {
    if (known.current.size > 64) known.current.clear();
    known.current.add(text);
  };

  // Changes made some other way than typing (buttons, dictation) -> shared text.
  useEffect(() => {
    if (!ytext || known.current.has(value) || ytext.toString() === value) return;
    remember(value);
    ytext.doc?.transact(() => applyDiff(ytext, value), LOCAL);
  }, [ytext, value]);

  // Shared text -> field, straight away, keeping the caret in place.
  useEffect(() => {
    if (!ytext) return;
    const onChange = (event: Y.YTextEvent, tx: Y.Transaction) => {
      if (tx.origin === LOCAL) return;
      const text = ytext.toString();
      remember(text);
      const el = field.current;
      if (el && el.value !== text) {
        const focused = document.activeElement === el && el.selectionStart !== null;
        const delta = event.delta as { retain?: number; insert?: unknown; delete?: number }[];
        const sel = focused ? [shift(el.selectionStart!, delta), shift(el.selectionEnd ?? el.selectionStart!, delta)] : null;
        el.value = text;
        if (sel) el.setSelectionRange(sel[0], sel[1]);
      }
      setRef.current(text);
    };
    ytext.observe(onChange);
    return () => ytext.unobserve(onChange);
  }, [ytext, field]);

  return useCallback(
    (next: string) => {
      remember(next);
      if (ytext && ytext.toString() !== next) ytext.doc?.transact(() => applyDiff(ytext, next), LOCAL);
    },
    [ytext],
  );
}
