import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Mic, Pin, Plus, Square, Trash2 } from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import {
  downloadFile,
  exportJSON,
  localDate,
  useToolStorage,
} from '../utils/toolStorage';

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

export default function Notes(props: ToolProps) {
  const store = useToolStorage('notes', EMPTY);
  const { data, update } = store;
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('created');
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
  const patchNote = (patch: Partial<Note>) => {
    if (note)
      void update((s) => ({
        ...s,
        notes: s.notes.map((n) =>
          n.id === note.id ? { ...n, ...patch, updated: Date.now() } : n,
        ),
      }));
  };
  const groups = useMemo(() => {
    const result = new Map<string, Note[]>();
    data.notes
      .filter((n) =>
        `${n.title} ${n.body} ${n.tags} ${n.context} ${localDate(new Date(n.created))}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
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
  }, [data.notes, query, sort]);
  const create = async () => {
    stop();
    const created = Date.now();
    const n: Note = {
      id: crypto.randomUUID(),
      title: '',
      body: '',
      tags: '',
      context: '',
      created,
      updated: created,
      pinned: false,
    };
    if (await update((s) => ({ ...s, notes: [n, ...s.notes] }))) {
      setSelected(n.id);
      window.requestAnimationFrame(() => titleRef.current?.focus());
      setQuery('');
      setMessage('');
    }
  };
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
  return (
    <ToolShell
      {...props}
      name="NinjaNotes"
      subtitle="Capture a thought, dictate a meeting, and find it on your timeline."
      status={store.status}
      error={store.error}
    >
      <div className="tool-row tool-row--between" style={{ marginBottom: 20 }}>
        <button
          className="btn btn-primary"
          disabled={!store.ready || listening || preparing}
          onClick={() => void create()}
        >
          <Plus size={16} />
          New note
        </button>
        <div className="tool-row">
          <button
            className="btn btn-secondary"
            onClick={() => exportJSON('ninjanotes-backup.json', data)}
          >
            Backup all notes
          </button>
          <button
            className="btn btn-secondary"
            disabled={!store.ready || listening || preparing}
            onClick={() => importRef.current?.click()}
          >
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
              if (await update((s) => ({ ...s, notes: [undo, ...s.notes] }))) {
                setSelected(undo.id);
                setUndo(null);
              }
            }}
          >
            Undo delete
          </button>
        </div>
      )}
      <div className="tool-note-layout">
        <aside className="tool-panel">
          <label>
            Search notes
            <input
              type="search"
              placeholder="Words, tags, project, date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label style={{ marginTop: 12 }}>
            Timeline order
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="created">Newest captured</option>
              <option value="updated">Recently edited</option>
            </select>
          </label>
          <div className="tool-note-list">
            {groups.map(([name, notes]) => (
              <section key={name}>
                <h3>{name}</h3>
                {notes.map((n) => (
                  <button
                    key={n.id}
                    className="tool-note-item"
                    disabled={listening || preparing}
                    aria-current={note?.id === n.id}
                    onClick={() => setSelected(n.id)}
                  >
                    <strong>
                      {n.pinned ? '● ' : ''}
                      {n.title || 'Untitled note'}
                    </strong>
                    <span>
                      {new Date(n.created).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {n.body.slice(0, 65) || 'Empty note'}
                    </span>
                  </button>
                ))}
              </section>
            ))}
            {!groups.length && (
              <div className="tool-empty">
                {query
                  ? 'No matching notes.'
                  : 'Your notes will appear here, grouped by date.'}
              </div>
            )}
          </div>
        </aside>
        <section className="tool-panel">
          {!note ? (
            <div className="tool-empty">
              <h2>Start with a thought.</h2>
              <p>
                Create a note to type or dictate. Everything is organized by
                capture time.
              </p>
            </div>
          ) : (
            <>
              <label>
                <span className="sr-only">Note title</span>
                <input
                  className="tool-note-title"
                  ref={titleRef}
                  aria-label="Note title"
                  placeholder="Untitled note"
                  disabled={!store.ready}
                  value={note.title}
                  onChange={(e) => patchNote({ title: e.target.value })}
                />
              </label>
              <div className="tool-note-meta">
                Captured {new Date(note.created).toLocaleString()} · Edited{' '}
                {new Date(note.updated).toLocaleString()}
              </div>
              <div className="tool-fields">
                <label>
                  Project / client
                  <input
                    placeholder="Optional context"
                    value={note.context}
                    disabled={!store.ready}
                    onChange={(e) => patchNote({ context: e.target.value })}
                  />
                </label>
                <label>
                  Tags
                  <input
                    placeholder="meeting, ideas, follow-up"
                    value={note.tags}
                    disabled={!store.ready}
                    onChange={(e) => patchNote({ tags: e.target.value })}
                  />
                </label>
              </div>
              <label>
                <span className="sr-only">Note text</span>
                <textarea
                  className="tool-note-body"
                  aria-label="Note text"
                  placeholder="Write freely. Dictated passages are timestamped here."
                  value={note.body}
                  disabled={!store.ready}
                  onChange={(e) => patchNote({ body: e.target.value })}
                />
              </label>
              {interim && (
                <p className="tool-muted" role="status">
                  Listening: {interim}
                </p>
              )}
              <div className="tool-row">
                <button
                  className="btn btn-secondary"
                  disabled={!store.ready}
                  aria-pressed={note.pinned}
                  onClick={() => patchNote({ pinned: !note.pinned })}
                >
                  <Pin size={15} />
                  {note.pinned ? 'Unpin' : 'Pin note'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    downloadFile(
                      `${note.title || 'note'}.md`,
                      `# ${note.title || 'Untitled note'}\n\nCaptured: ${new Date(note.created).toISOString()}\nProject: ${note.context}\nTags: ${note.tags}\n\n${note.body}\n`,
                      'text/markdown;charset=utf-8',
                    )
                  }
                >
                  <Download size={15} />
                  Export Markdown
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={!store.ready || listening || preparing}
                  onClick={async () => {
                    if (
                      await update((s) => ({
                        ...s,
                        notes: s.notes.filter((n) => n.id !== note.id),
                      }))
                    ) {
                      setUndo(note);
                      setSelected(null);
                    }
                  }}
                >
                  <Trash2 size={15} />
                  Delete note
                </button>
              </div>
              <div className="tool-note-actions">
                <h3>Voice to text</h3>
                {!speechAPI() ? (
                  <p className="tool-muted">
                    Speech recognition is unavailable in this browser. You can
                    still type, search, and export notes.
                  </p>
                ) : (
                  <>
                    <div className="tool-fields">
                      <label>
                        Speech processing
                        <select
                          value={mode}
                          disabled={listening || preparing}
                          onChange={(e) => setMode(e.target.value)}
                        >
                          <option value="local">
                            On-device (when supported)
                          </option>
                          <option value="online">Online browser service</option>
                        </select>
                      </label>
                      <label>
                        Language
                        <select
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
                      </label>
                    </div>
                    <div className="tool-row">
                      <button
                        className="btn btn-primary"
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
                      {mode === 'local' && (
                        <button
                          className="btn btn-secondary"
                          disabled={preparing || listening}
                          onClick={() => void installLanguage()}
                        >
                          Download language pack
                        </button>
                      )}
                    </div>
                    <p className="tool-muted" style={{ marginTop: 12 }}>
                      {mode === 'local'
                        ? 'Requires browser support and a downloaded language pack. Audio is processed on your device.'
                        : 'Your browser’s speech service may receive audio. You will be asked before recording starts.'}{' '}
                      Transcripts save in this browser; audio is not saved by
                      NinjaNotes.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </ToolShell>
  );
}
