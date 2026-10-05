import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { DictateField } from '../components/Dictate';
import { appendSpoken } from '../utils/speech';
import {
  Copy,
  Download,
  Eye,
  ListChecks,
  Mic,
  PenLine,
  Pin,
  PinOff,
  Plus,
  Search,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AppMark } from '../components/AppMark';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import {
  downloadFile,
  exportJSON,
  localDate,
  useToolStorage,
} from '../utils/toolStorage';
import '../styles/notes.css';

interface Note {
  id: string;
  title: string;
  body: string;
  tags: string;
  context: string;
  created: number;
  updated: number;
  pinned: boolean;
}
interface NotesWorkspace {
  version: 1;
  notes: Note[];
  /** id -> when it was deleted, so device sync does not bring it back. */
  deleted?: Record<string, number>;
}
const EMPTY: NotesWorkspace = { version: 1, notes: [] };
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  processLocally?: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<RecognitionResult>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
interface RecognitionConstructor {
  new (): Recognition;
  available?: (options: {
    langs: string[];
    processLocally: boolean;
  }) => Promise<string>;
  install?: (options: {
    langs: string[];
    processLocally: boolean;
  }) => Promise<boolean>;
}
function speechAPI() {
  const w = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
function groupName(time: number) {
  const date = localDate(new Date(time));
  if (date === localDate()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date === localDate(yesterday)) return 'Yesterday';
  return new Date(time).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
function validNotes(value: unknown): value is NotesWorkspace {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<NotesWorkspace>;
  return (
    v.version === 1 &&
    Array.isArray(v.notes) &&
    v.notes.length <= 20_000 &&
    v.notes.every(
      (n) =>
        n &&
        typeof n === 'object' &&
        ['id', 'title', 'body', 'tags', 'context'].every(
          (key) => typeof n[key as keyof Note] === 'string',
        ) &&
        Number.isFinite(n.created) &&
        n.created >= 0 &&
        n.created <= 8640000000000000 &&
        Number.isFinite(n.updated) &&
        n.updated >= 0 &&
        n.updated <= 8640000000000000 &&
        typeof n.pinned === 'boolean',
    )
  );
}

/* ---------- Note text helpers ---------- */

const TASK = /^(\s*)[-*] \[([ xX])\](?: (.*))?$/;
const BULLET = /^(\s*)[-*•] (.*)$/;
const NUMBERED = /^(\s*)(\d+)[.)] (.*)$/;
const LIST_PREFIX = /^(\s*)(?:([-*]) \[[ xX]\] |([-*•]) |(\d+)([.)]) )/;

/** Comma-separated tags, trimmed, without a leading '#', de-duplicated. */
function parseTags(tags: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags.split(',')) {
    const tag = raw.trim().replace(/^#+/, '').trim();
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out;
}
function taskStats(body: string) {
  let total = 0,
    done = 0;
  for (const line of body.split('\n')) {
    const m = TASK.exec(line);
    if (m) {
      total++;
      if (m[2] !== ' ') done++;
    }
  }
  return { total, done };
}
/** A line with list and inline Markdown markers removed, for list previews. */
function plainLine(line: string) {
  return line
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/^\s*[-*] \[[ xX]\]\s?/, '')
    .replace(/^\s*[-*•>]\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}
function describe(n: Note) {
  const lines = n.body
    .split('\n')
    .map(plainLine)
    .filter(Boolean);
  const title = n.title.trim() || lines.shift() || 'Untitled note';
  const preview = lines.join(' ').slice(0, 120);
  return { title, preview };
}
function countWords(text: string) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}
function relativeTime(time: number, now: number) {
  const seconds = Math.round((now - time) / 1000);
  if (seconds < 45) return 'just now';
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, 'day');
  return new Date(time).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
function plural(count: number, word: string) {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
}
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
    return true;
  if (target instanceof HTMLInputElement)
    return !['checkbox', 'radio', 'button', 'submit', 'file', 'color'].includes(
      target.type,
    );
  return false;
}

/* ---------- Safe rendering (React elements only, never raw HTML) ---------- */

function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: ReactNode[] = [];
  let from = 0;
  let index = lower.indexOf(needle);
  while (index !== -1 && out.length < 40) {
    if (index > from) out.push(text.slice(from, index));
    out.push(
      <mark key={index} className="notes-mark">
        {text.slice(index, index + needle.length)}
      </mark>,
    );
    from = index + needle.length;
    index = lower.indexOf(needle, from);
  }
  if (!out.length) return text;
  if (from < text.length) out.push(text.slice(from));
  return out;
}
function safeHref(url: string) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
const INLINE =
  /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s<>]*[^\s<>.,;:!?'")\]])/g;
function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(INLINE)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > last) out.push(text.slice(last, index));
    const k = `${key}-${i++}`;
    if (token.startsWith('**')) {
      out.push(<strong key={k}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      out.push(<code key={k}>{token.slice(1, -1)}</code>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      const label = link ? link[1] : token;
      const href = safeHref(link ? link[2] : token);
      out.push(
        href ? (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          token
        ),
      );
    }
    last = index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
const isRule = (line: string) => /^\s*(-{3,}|\*{3,})\s*$/.test(line);
function startsBlock(line: string) {
  return (
    !line.trim() ||
    /^#{1,3}\s/.test(line) ||
    TASK.test(line) ||
    BULLET.test(line) ||
    NUMBERED.test(line) ||
    /^>\s?/.test(line) ||
    isRule(line)
  );
}
function NotePreview({
  body,
  disabled,
  onToggle,
}: {
  body: string;
  disabled: boolean;
  onToggle: (line: number) => void;
}) {
  const lines = body.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const start = i;
    if (!line.trim()) {
      i++;
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], `h${start}`);
      blocks.push(
        level === 1 ? (
          <h2 key={start} className="notes-md-h1">
            {content}
          </h2>
        ) : level === 2 ? (
          <h3 key={start} className="notes-md-h2">
            {content}
          </h3>
        ) : (
          <h4 key={start} className="notes-md-h3">
            {content}
          </h4>
        ),
      );
      i++;
      continue;
    }
    if (isRule(line) && !TASK.test(line)) {
      blocks.push(<hr key={start} />);
      i++;
      continue;
    }
    if (TASK.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && TASK.test(lines[i])) {
        const m = TASK.exec(lines[i])!;
        const lineIndex = i;
        const checked = m[2] !== ' ';
        items.push(
          <li
            key={lineIndex}
            style={{ marginLeft: `${Math.min(m[1].length, 8) * 0.5}rem` }}
          >
            <label className={`notes-task${checked ? ' is-done' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(lineIndex)}
              />
              <span>{renderInline(m[3] ?? '', `t${lineIndex}`)}</span>
            </label>
          </li>,
        );
        i++;
      }
      blocks.push(
        <ul key={start} className="notes-md-tasks">
          {items}
        </ul>,
      );
      continue;
    }
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const numbered = NUMBERED.test(line);
      const pattern = numbered ? NUMBERED : BULLET;
      const items: ReactNode[] = [];
      while (
        i < lines.length &&
        pattern.test(lines[i]) &&
        !TASK.test(lines[i])
      ) {
        const m = pattern.exec(lines[i])!;
        items.push(
          <li key={i}>{renderInline(numbered ? m[3] : m[2], `l${i}`)}</li>,
        );
        i++;
      }
      blocks.push(
        numbered ? (
          <ol
            key={start}
            start={Number(NUMBERED.exec(line)![2])}
            className="notes-md-list"
          >
            {items}
          </ol>
        ) : (
          <ul key={start} className="notes-md-list">
            {items}
          </ul>
        ),
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: ReactNode[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        if (quote.length) quote.push(<br key={`b${i}`} />);
        quote.push(...renderInline(lines[i].replace(/^>\s?/, ''), `q${i}`));
        i++;
      }
      blocks.push(<blockquote key={start}>{quote}</blockquote>);
      continue;
    }
    const para: ReactNode[] = [];
    do {
      if (para.length) para.push(<br key={`b${i}`} />);
      para.push(...renderInline(lines[i], `p${i}`));
      i++;
    } while (i < lines.length && !startsBlock(lines[i]));
    blocks.push(<p key={start}>{para}</p>);
  }
  return (
    <div className="notes-preview" role="region" aria-label="Rendered note">
      {blocks.length ? (
        blocks
      ) : (
        <p className="notes-preview__empty">
          Nothing to preview yet. Switch to Edit to start writing.
        </p>
      )}
    </div>
  );
}

export default function Notes(props: ToolProps) {
  const store = useToolStorage('notes', EMPTY);
  const { data, update } = store;
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState('created');
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const [undo, setUndo] = useState<Note | null>(null);
  const [listening, setListening] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [interim, setInterim] = useState('');
  const [mode, setMode] = useState('local');
  const [language, setLanguage] = useState('en-US');
  const recognition = useRef<Recognition | null>(null);
  const session = useRef(0);
  const importRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const note = data.notes.find((n) => n.id === selected) ?? data.notes[0];
  const stop = () => {
    session.current++;
    recognition.current?.stop();
    setPreparing(false);
  };
  useEffect(
    () => () => {
      session.current++;
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onend = null;
        recognition.current.abort();
      }
    },
    [],
  );
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  // Restore the caret after a programmatic edit (list continuation, checklist).
  useLayoutEffect(() => {
    const caret = pendingCaret.current;
    if (caret !== null && bodyRef.current) {
      pendingCaret.current = null;
      bodyRef.current.focus();
      bodyRef.current.setSelectionRange(caret, caret);
    }
  }, [note?.body, view]);
  const patchNote = (patch: Partial<Note>) => {
    if (note)
      void update((s) => ({
        ...s,
        notes: s.notes.map((n) =>
          n.id === note.id ? { ...n, ...patch, updated: Date.now() } : n,
        ),
      }));
  };
  const tagIndex = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const n of data.notes)
      for (const tag of parseTags(n.tags)) {
        const key = tag.toLowerCase();
        const entry = counts.get(key);
        if (entry) entry.count++;
        else counts.set(key, { label: tag, count: 1 });
      }
    return [...counts]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [data.notes]);
  // Ignore filters for tags that no longer exist on any note.
  const filterTags = useMemo(
    () =>
      activeTags.filter((t) => tagIndex.some((entry) => entry.key === t)),
    [activeTags, tagIndex],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.notes.filter((n) => {
      if (
        q &&
        !`${n.title} ${n.body} ${n.tags} ${n.context} ${localDate(new Date(n.created))}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (filterTags.length) {
        const own = parseTags(n.tags).map((t) => t.toLowerCase());
        return filterTags.every((t) => own.includes(t));
      }
      return true;
    });
  }, [data.notes, query, filterTags]);
  const groups = useMemo(() => {
    const result = new Map<string, Note[]>();
    [...visible]
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          (sort === 'updated' ? b.updated - a.updated : b.created - a.created),
      )
      .forEach((n) => {
        const key = n.pinned
          ? 'Pinned'
          : groupName(sort === 'updated' ? n.updated : n.created);
        result.set(key, [...(result.get(key) ?? []), n]);
      });
    return [...result];
  }, [visible, sort]);
  const toggleTag = (tag: string) => {
    const key = tag.toLowerCase();
    const live = filterTags;
    setActiveTags(
      live.includes(key) ? live.filter((t) => t !== key) : [...live, key],
    );
  };
  const create = async () => {
    stop();
    const created = Date.now();
    const n: Note = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      // A note created while filtering by tags starts with those tags.
      tags: filterTags
        .map((t) => tagIndex.find((entry) => entry.key === t)?.label ?? t)
        .join(', '),
      context: '',
      created,
      updated: created,
      pinned: false,
    };
    if (await update((s) => ({ ...s, notes: [n, ...s.notes] }))) {
      setSelected(n.id);
      setView('edit');
      window.requestAnimationFrame(() => titleRef.current?.focus());
      setQuery('');
      setMessage('');
    }
  };
  const duplicate = async () => {
    if (!note) return;
    const created = Date.now();
    const copy: Note = {
      ...note,
      id: crypto.randomUUID(),
      title: note.title ? `${note.title} (copy)` : '',
      created,
      updated: created,
      pinned: false,
    };
    if (await update((s) => ({ ...s, notes: [copy, ...s.notes] }))) {
      setSelected(copy.id);
      setQuery('');
    }
  };
  const writeBody = (body: string, caret: number) => {
    pendingCaret.current = caret;
    patchNote({ body });
  };
  /** Turns the caret's line into a checklist item, or back into plain text. */
  const toggleChecklistLine = () => {
    if (!note) return;
    const body = note.body;
    const field = bodyRef.current;
    if (view === 'preview' || !field) {
      // From preview, add a fresh item at the end of the note.
      const sep = !body || body.endsWith('\n') ? '' : '\n';
      const next = `${body}${sep}- [ ] `;
      setView('edit');
      writeBody(next, next.length);
      return;
    }
    const caret = field.selectionStart;
    const lineStart = body.lastIndexOf('\n', caret - 1) + 1;
    const nextBreak = body.indexOf('\n', caret);
    const lineEnd = nextBreak === -1 ? body.length : nextBreak;
    const line = body.slice(lineStart, lineEnd);
    let next: string;
    const task = TASK.exec(line);
    if (task) {
      next = `${task[1]}${task[3] ?? ''}`;
    } else {
      const bullet = BULLET.exec(line);
      next = bullet ? `${bullet[1]}- [ ] ${bullet[2]}` : `- [ ] ${line}`;
    }
    const delta = next.length - line.length;
    writeBody(
      body.slice(0, lineStart) + next + body.slice(lineEnd),
      Math.max(lineStart, caret + delta),
    );
  };
  const toggleTask = (lineIndex: number) => {
    if (!note) return;
    const lines = note.body.split('\n');
    const m = TASK.exec(lines[lineIndex] ?? '');
    if (!m) return;
    lines[lineIndex] = lines[lineIndex].replace(
      /\[([ xX])\]/,
      m[2] === ' ' ? '[x]' : '[ ]',
    );
    patchNote({ body: lines.join('\n') });
  };
  /** Enter continues checklists and lists; Enter on an empty item ends the list. */
  const onBodyKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      !e.altKey &&
      e.key.toLowerCase() === 'l'
    ) {
      e.preventDefault();
      toggleChecklistLine();
      return;
    }
    if (
      e.key !== 'Enter' ||
      e.shiftKey ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.nativeEvent.isComposing ||
      !note
    )
      return;
    const field = e.currentTarget;
    const { selectionStart, selectionEnd } = field;
    if (selectionStart !== selectionEnd) return;
    const body = note.body;
    const lineStart = body.lastIndexOf('\n', selectionStart - 1) + 1;
    const nextBreak = body.indexOf('\n', selectionStart);
    const lineEnd = nextBreak === -1 ? body.length : nextBreak;
    const line = body.slice(lineStart, lineEnd);
    const m = LIST_PREFIX.exec(line);
    if (!m || selectionStart - lineStart < m[0].length) return;
    e.preventDefault();
    if (!line.slice(m[0].length).trim()) {
      // An empty item: end the list by clearing its marker.
      writeBody(body.slice(0, lineStart) + body.slice(lineEnd), lineStart);
      return;
    }
    const indent = m[1];
    const prefix = m[2]
      ? `${m[2]} [ ] `
      : m[3]
        ? `${m[3]} `
        : `${Number(m[4]) + 1}${m[5]} `;
    const insert = `\n${indent}${prefix}`;
    writeBody(
      body.slice(0, selectionStart) + insert + body.slice(selectionStart),
      selectionStart + insert.length,
    );
  };
  // Global shortcuts: Alt+N creates a note; "/" jumps to search when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (
        e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        e.code === 'KeyN'
      ) {
        e.preventDefault();
        if (store.ready && !listening && !preparing) void create();
        return;
      }
      if (
        e.key === '/' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const startVoice = async () => {
    const Constructor = speechAPI();
    if (!Constructor || !note || !store.ready) return;
    const noteId = note.id;
    const token = ++session.current;
    setMessage('');
    setPreparing(true);
    try {
      const instance = new Constructor();
      instance.lang = language;
      instance.continuous = true;
      instance.interimResults = true;
      if (mode === 'local') {
        if (!('processLocally' in instance) || !Constructor.available)
          throw new Error(
            'On-device dictation is not supported in this browser. You can type, or explicitly choose online dictation.',
          );
        const availability = await Constructor.available({
          langs: [language],
          processLocally: true,
        });
        if (token !== session.current) return;
        if (availability !== 'available')
          throw new Error(
            'The on-device language pack is not ready. Use “Download language pack”, or choose another language.',
          );
        instance.processLocally = true;
      } else {
        if (
          !window.confirm(
            'Online dictation may send microphone audio to your browser’s speech service. Start online dictation?',
          )
        )
          return;
        if ('processLocally' in instance) instance.processLocally = false;
      }
      if (token !== session.current) return;
      recognition.current = instance;
      instance.onresult = (event) => {
        // A final result from stop() still belongs to the note where recording began.
        let final = '',
          partial = '';
        for (
          let index = event.resultIndex;
          index < event.results.length;
          index++
        ) {
          const item = event.results[index];
          if (item.isFinal) final += `${item[0].transcript.trim()} `;
          else partial += item[0].transcript;
        }
        setInterim(partial);
        if (final.trim()) {
          const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          void update((s) => ({
            ...s,
            notes: s.notes.map((n) =>
              n.id === noteId
                ? {
                    ...n,
                    body: `${n.body}${n.body ? '\n\n' : ''}[${timestamp}] ${final.trim()}`,
                    updated: Date.now(),
                  }
                : n,
            ),
          }));
        }
      };
      instance.onerror = (event) =>
        setMessage(
          event.error === 'not-allowed'
            ? 'Microphone or speech permission was denied. Allow it in browser settings to dictate.'
            : `Dictation stopped (${event.error}). Your saved notes are safe; you can keep typing.`,
        );
      instance.onend = () => {
        if (recognition.current === instance) {
          recognition.current = null;
          setListening(false);
          setInterim('');
        }
      };
      instance.start();
      setListening(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Dictation could not start.',
      );
    } finally {
      setPreparing(false);
    }
  };
  const installLanguage = async () => {
    const Constructor = speechAPI();
    if (!Constructor?.install) {
      setMessage('This browser cannot install on-device speech packs.');
      return;
    }
    setPreparing(true);
    try {
      setMessage(
        (await Constructor.install({ langs: [language], processLocally: true }))
          ? 'Language pack ready. You can start on-device dictation.'
          : 'The language pack could not be installed.',
      );
    } catch {
      setMessage('The language pack could not be installed in this browser.');
    } finally {
      setPreparing(false);
    }
  };
  const noteTags = note ? parseTags(note.tags) : [];
  const stats = note ? taskStats(note.body) : { total: 0, done: 0 };
  const filtering = Boolean(query.trim() || filterTags.length);
  return (
    <ToolShell
      {...props}
      name="NinjaNotes"
      subtitle="Capture a thought, dictate a meeting, and find it on your timeline."
      status={store.status}
      error={store.error}
    >
      <div className="tool-toolbar">
        <button
          className="btn btn-primary"
          disabled={!store.ready || listening || preparing}
          onClick={() => void create()}
          title="New note (Alt+N)"
          aria-keyshortcuts="Alt+N"
        >
          <Plus size={16} />
          New note
        </button>
        <div className="tool-row">
          <button
            className="btn btn-secondary"
            onClick={() => exportJSON('ninjanotes-backup.json', data)}
          >
            <Download size={15} />
            Backup all notes
          </button>
          <button
            className="btn btn-secondary"
            disabled={!store.ready || listening || preparing}
            onClick={() => importRef.current?.click()}
          >
            <Upload size={15} />
            Import notes
          </button>
          <input
            type="file"
            hidden
            ref={importRef}
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                if (file.size > 20_000_000) throw new Error();
                const value: unknown = JSON.parse(await file.text());
                if (!validNotes(value)) throw new Error();
                const notes = value.notes.map((n) => ({
                  ...n,
                  id: crypto.randomUUID(),
                }));
                if (
                  await update((s) => ({ ...s, notes: [...notes, ...s.notes] }))
                )
                  setMessage(
                    `Imported ${notes.length} notes. Existing notes were kept.`,
                  );
              } catch {
                setMessage(
                  'That file is not a valid NinjaNotes backup. Existing notes were kept.',
                );
              }
            }}
          />
        </div>
      </div>
      {message && (
        <div className="tool-alert" role="status">
          {message}
        </div>
      )}
      {undo && (
        <div className="tool-alert">
          Note deleted.{' '}
          <button
            className="btn btn-secondary"
            disabled={!store.ready}
            onClick={async () => {
              if (
                await update((s) => {
                  const deleted = { ...(s.deleted ?? {}) };
                  delete deleted[undo.id];
                  return { ...s, notes: [undo, ...s.notes], deleted };
                })
              ) {
                setSelected(undo.id);
                setUndo(null);
              }
            }}
          >
            Undo delete
          </button>
        </div>
      )}
      <div className="tool-note-layout notes-layout">
        <aside className="tool-panel tool-note-sidebar notes-sidebar">
          <label className="notes-search">
            <span className="sr-only">Search notes</span>
            <span className="notes-search__field">
              <Search
                size={15}
                aria-hidden="true"
                className="notes-search__icon"
              />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search words, tags…"
                title="Search notes (press / to focus)"
                aria-keyshortcuts="/"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && query) {
                    e.preventDefault();
                    setQuery('');
                  }
                }}
              />
              {!query && (
                <kbd className="notes-kbd notes-search__kbd" aria-hidden="true">
                  /
                </kbd>
              )}
            </span>
          </label>
          {tagIndex.length > 0 && (
            <div
              className="notes-tagbar"
              role="group"
              aria-label="Filter by tag"
            >
              {tagIndex.map((t) => {
                const on = filterTags.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    className="notes-chip"
                    aria-pressed={on}
                    title={
                      on
                        ? `Stop filtering by #${t.label}`
                        : `Show notes tagged #${t.label}`
                    }
                    disabled={listening || preparing}
                    onClick={() => toggleTag(t.label)}
                  >
                    #{t.label}
                    <span className="notes-chip__count">{t.count}</span>
                  </button>
                );
              })}
              {filterTags.length > 0 && (
                <button
                  type="button"
                  className="notes-chip notes-chip--clear"
                  onClick={() => setActiveTags([])}
                >
                  <X size={12} aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>
          )}
          <div className="notes-listbar">
            <span className="notes-count">
              {filtering
                ? `${visible.length} of ${plural(data.notes.length, 'note')}`
                : plural(data.notes.length, 'note')}
            </span>
            <select
              aria-label="Timeline order"
              className="notes-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="created">Newest captured</option>
              <option value="updated">Recently edited</option>
            </select>
          </div>
          <div className="tool-note-list">
            {groups.map(([name, notes]) => (
              <section key={name}>
                <h3>
                  {name === 'Pinned' && (
                    <Pin
                      size={11}
                      aria-hidden="true"
                      className="tool-note-pin"
                    />
                  )}
                  {name}
                </h3>
                {notes.map((n) => {
                  const { title, preview } = describe(n);
                  const tags = parseTags(n.tags);
                  const tasks = taskStats(n.body);
                  const stamp = n.pinned
                    ? new Date(n.updated).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : new Date(
                        sort === 'updated' ? n.updated : n.created,
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                  return (
                    <button
                      key={n.id}
                      className="tool-note-item notes-item"
                      disabled={listening || preparing}
                      aria-current={note?.id === n.id}
                      onClick={() => setSelected(n.id)}
                    >
                      <strong className={n.title.trim() ? '' : 'is-derived'}>
                        {highlight(title, query)}
                      </strong>
                      <span className="notes-item__line">
                        <span className="notes-item__time">{stamp}</span>
                        <span className="notes-item__preview">
                          {preview
                            ? highlight(preview, query)
                            : 'No additional text'}
                        </span>
                      </span>
                      {(tags.length > 0 || tasks.total > 0) && (
                        <span className="notes-item__extras">
                          {tasks.total > 0 && (
                            <span
                              className="notes-item__tasks"
                              title={`${tasks.done} of ${tasks.total} checklist items done`}
                            >
                              <ListChecks size={12} aria-hidden="true" />
                              {tasks.done}/{tasks.total}
                            </span>
                          )}
                          {tags.slice(0, 3).map((t) => (
                            <span key={t} className="notes-chip notes-chip--sm">
                              #{t}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="notes-chip notes-chip--sm">
                              +{tags.length - 3}
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </section>
            ))}
            {!groups.length && (
              <div className="tool-empty notes-list-empty">
                {filtering ? (
                  <>
                    <p>No matching notes.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setQuery('');
                        setActiveTags([]);
                      }}
                    >
                      Clear search and filters
                    </button>
                  </>
                ) : (
                  'Your notes will appear here, grouped by date.'
                )}
              </div>
            )}
          </div>
          <p className="tool-hint notes-shortcuts">
            <kbd className="notes-kbd">Alt</kbd>+
            <kbd className="notes-kbd">N</kbd> new note ·{' '}
            <kbd className="notes-kbd">/</kbd> search
          </p>
        </aside>
        <section className="tool-panel tool-note-editor notes-editor">
          {!note ? (
            <div className="tool-empty">
              <AppMark app="notes" size="lg" />
              <h2>Start with a thought.</h2>
              <p>
                Create a note to type or dictate. Everything is organized by
                capture time.
              </p>
              <button
                className="btn btn-primary"
                disabled={!store.ready}
                onClick={() => void create()}
              >
                <Plus size={16} />
                Create a note
              </button>
            </div>
          ) : (
            <>
              <div className="tool-note-head notes-head">
                <label>
                  <span className="sr-only">Note title</span>
                  <DictateField
                    label="note title"
                    disabled={!store.ready}
                    onText={(spoken) =>
                      patchNote({ title: appendSpoken(note.title, spoken) })
                    }
                  >
                    <input
                      className="tool-note-title"
                      ref={titleRef}
                      aria-label="Note title"
                      placeholder="Untitled note"
                      disabled={!store.ready}
                      value={note.title}
                      onChange={(e) => patchNote({ title: e.target.value })}
                    />
                  </DictateField>
                </label>
                <div className="tool-row tool-note-tools">
                  <button
                    className="btn btn-secondary btn-icon"
                    disabled={!store.ready}
                    aria-pressed={note.pinned}
                    aria-label={note.pinned ? 'Unpin' : 'Pin note'}
                    title={note.pinned ? 'Unpin' : 'Pin note'}
                    onClick={() => patchNote({ pinned: !note.pinned })}
                  >
                    {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    aria-label="Duplicate note"
                    title="Duplicate note"
                    disabled={!store.ready || listening || preparing}
                    onClick={() => void duplicate()}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    aria-label="Export Markdown"
                    title="Export Markdown"
                    onClick={() =>
                      downloadFile(
                        `${note.title || 'note'}.md`,
                        `# ${note.title || 'Untitled note'}

Captured: ${new Date(note.created).toISOString()}
Project: ${note.context}
Tags: ${note.tags}

${note.body}
`,
                        'text/markdown;charset=utf-8',
                      )
                    }
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    aria-label="Delete note"
                    title="Delete note"
                    disabled={!store.ready || listening || preparing}
                    onClick={async () => {
                      if (
                        await update((s) => ({
                          ...s,
                          notes: s.notes.filter((n) => n.id !== note.id),
                          deleted: { ...(s.deleted ?? {}), [note.id]: Date.now() },
                        }))
                      ) {
                        setUndo(note);
                        setSelected(null);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="tool-note-meta notes-meta">
                <div className="notes-meta__items">
                <span title={new Date(note.created).toLocaleString()}>
                  Captured{' '}
                  {new Date(note.created).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span title={new Date(note.updated).toLocaleString()}>
                  Edited {relativeTime(note.updated, now)}
                </span>
                <span>{plural(countWords(note.body), 'word')}</span>
                <span>{plural(note.body.length, 'character')}</span>
                {stats.total > 0 && (
                  <span>
                    {stats.done}/{stats.total} done
                  </span>
                )}
                </div>
              </div>
              <div className="tool-fields">
                <label>
                  Project / client
                  <DictateField
                    label="project or client"
                    disabled={!store.ready}
                    onText={(spoken) =>
                      patchNote({ context: appendSpoken(note.context, spoken) })
                    }
                  >
                    <input
                      placeholder="Optional context"
                      value={note.context}
                      disabled={!store.ready}
                      onChange={(e) => patchNote({ context: e.target.value })}
                    />
                  </DictateField>
                </label>
                <label>
                  Tags
                  <DictateField
                    label="tags"
                    disabled={!store.ready}
                    onText={(spoken) => {
                      // "meeting and follow up" becomes "meeting, follow up".
                      const spokenTags = spoken
                        .toLowerCase()
                        .split(/,|\band\b/)
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .join(', ');
                      patchNote({
                        tags: note.tags.trim()
                          ? `${note.tags.replace(/[,\s]+$/, '')}, ${spokenTags}`
                          : spokenTags,
                      });
                    }}
                  >
                    <input
                      placeholder="meeting, ideas, follow-up"
                      value={note.tags}
                      disabled={!store.ready}
                      onChange={(e) => patchNote({ tags: e.target.value })}
                    />
                  </DictateField>
                </label>
              </div>
              {noteTags.length > 0 && (
                <div className="notes-notetags">
                  {noteTags.map((t) => {
                    const on = filterTags.includes(t.toLowerCase());
                    return (
                      <button
                        key={t}
                        type="button"
                        className="notes-chip"
                        aria-pressed={on}
                        title={
                          on
                            ? `Stop filtering by #${t}`
                            : `Show notes tagged #${t}`
                        }
                        disabled={listening || preparing}
                        onClick={() => toggleTag(t)}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="tool-dictation">
                {!speechAPI() ? (
                  <p className="tool-muted">
                    Speech recognition is unavailable in this browser. You can
                    still type, search, and export notes.
                  </p>
                ) : (
                  <>
                    <div className="tool-dictation__controls">
                      <button
                        className={`btn ${listening ? 'btn-danger' : 'btn-primary'}`}
                        disabled={!store.ready || preparing}
                        onClick={() => (listening ? stop() : void startVoice())}
                      >
                        {listening ? <Square size={15} /> : <Mic size={15} />}
                        {listening
                          ? 'Stop dictation'
                          : preparing
                            ? 'Preparing…'
                            : 'Start dictation'}
                      </button>
                      <select
                        aria-label="Speech processing"
                        value={mode}
                        disabled={listening || preparing}
                        onChange={(e) => setMode(e.target.value)}
                      >
                        <option value="local">On-device</option>
                        <option value="online">Online service</option>
                      </select>
                      <select
                        aria-label="Language"
                        value={language}
                        disabled={listening || preparing}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        {[
                          ['en-US', 'English (US)'],
                          ['en-GB', 'English (UK)'],
                          ['fr-FR', 'French'],
                          ['de-DE', 'German'],
                          ['es-ES', 'Spanish'],
                          ['pt-BR', 'Portuguese'],
                          ['ja-JP', 'Japanese'],
                        ].map(([code, label]) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="tool-hint tool-muted">
                      {mode === 'local'
                        ? 'Audio is processed on this device; it needs a downloaded language pack.'
                        : 'Your browser’s speech service may receive audio; you are asked first.'}{' '}
                      Audio is never saved.
                      {mode === 'local' && (
                        <>
                          {' '}
                          <button
                            type="button"
                            className="tool-linkbtn"
                            disabled={preparing || listening}
                            onClick={() => void installLanguage()}
                          >
                            Download language pack
                          </button>
                        </>
                      )}
                    </p>
                  </>
                )}
                {interim && (
                  <p className="tool-dictation__interim" role="status">
                    Listening: {interim}
                  </p>
                )}
              </div>
              <div className="notes-formatbar">
                <div className="notes-seg" role="group" aria-label="Note view">
                  <button
                    type="button"
                    aria-pressed={view === 'edit'}
                    onClick={() => setView('edit')}
                  >
                    <PenLine size={14} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-pressed={view === 'preview'}
                    onClick={() => setView('preview')}
                  >
                    <Eye size={14} aria-hidden="true" />
                    Preview
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm notes-format-btn"
                  disabled={!store.ready}
                  title="Checklist (Ctrl+Shift+L). Lines starting with - [ ] become checkboxes."
                  aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
                  onClick={toggleChecklistLine}
                >
                  <ListChecks size={15} aria-hidden="true" />
                  Checklist
                </button>
                <span className="notes-formatbar__hint">
                  **bold** · # heading · - list · links
                </span>
              </div>
              {view === 'edit' ? (
                <label>
                  <span className="sr-only">Note text</span>
                  <textarea
                    ref={bodyRef}
                    className="tool-note-body"
                    aria-label="Note text"
                    placeholder="Write freely. Dictated passages are timestamped here."
                    value={note.body}
                    disabled={!store.ready}
                    onChange={(e) => patchNote({ body: e.target.value })}
                    onKeyDown={onBodyKeyDown}
                  />
                </label>
              ) : (
                <NotePreview
                  body={note.body}
                  disabled={!store.ready}
                  onToggle={toggleTask}
                />
              )}
            </>
          )}
        </section>
      </div>
    </ToolShell>
  );
}
