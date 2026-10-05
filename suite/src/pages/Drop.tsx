import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  ClipboardCopy,
  Download,
  ExternalLink,
  FolderOpen,
  Library,
  QrCode,
  Send,
  Upload,
  X,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { AppMark } from '../components/AppMark';
import type { AppKind } from '../components/AppMark';
import { randomWords } from '../utils/words';
import {
  DropReceiver,
  DropSender,
  LANES,
  STREAM_TO_DISK_BYTES,
  formatBytes,
  validShareName,
} from '../utils/drop/transfer';
import type { Download as DownloadState, OfferedFile } from '../utils/drop/transfer';
import { listLibrary, openReceived, opensIn } from '../utils/drop/library';
import type { LibraryItem } from '../utils/drop/library';
import '../styles/tools.css';
import '../styles/drop.css';

function useTicker(target: EventTarget | null) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!target) return;
    const bump = () => setTick((n) => n + 1);
    target.addEventListener('change', bump);
    return () => target.removeEventListener('change', bump);
  }, [target]);
}

function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function useQr(text: string, show: boolean) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    if (!show || !text) return;
    let live = true;
    void import('qrcode-generator').then(({ default: qrcode }) => {
      const code = qrcode(0, 'M');
      code.addData(text);
      code.make();
      if (live) setSvg(code.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
    });
    return () => {
      live = false;
    };
  }, [text, show]);
  return show ? svg : '';
}

const LIBRARY_APP: Record<string, AppKind> = {
  word: 'word',
  excel: 'excel',
  powerpoint: 'powerpoint',
  blueline: 'blueline',
  pdf: 'pdf',
  image: 'image',
  svg: 'svg',
  note: 'notes',
};

/* ---------------- sending ---------------- */

function LibraryPicker({ onPick, onClose }: { onPick: (items: LibraryItem[]) => void; onClose: () => void }) {
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  useEffect(() => {
    void listLibrary().then(setItems);
  }, []);
  const shown = (items ?? []).filter((i) => i.title.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <section className="tool-panel drop-library" role="dialog" aria-label="Choose from your files">
      <header className="drop-library__head">
        <h2>Your NinjaOffice files</h2>
        <button type="button" className="btn btn-secondary btn-icon" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      <input type="search" placeholder="Search your files" aria-label="Search your files" value={query} onChange={(e) => setQuery(e.target.value)} />
      {!items ? (
        <p className="tool-muted">Loading…</p>
      ) : !items.length ? (
        <p className="tool-muted">Nothing stored yet. Documents, designs, notes, PDFs, images and drawings you make here show up in this list.</p>
      ) : (
        <ul className="drop-library__list">
          {shown.map((item) => (
            <li key={item.key}>
              <label>
                <input
                  type="checkbox"
                  checked={chosen.has(item.key)}
                  onChange={(e) => {
                    const next = new Set(chosen);
                    if (e.target.checked) next.add(item.key);
                    else next.delete(item.key);
                    setChosen(next);
                  }}
                />
                <AppMark app={LIBRARY_APP[item.kind]} size="sm" />
                <span className="drop-library__title">{item.title}</span>
                <span className="drop-library__when">{item.updated ? new Date(item.updated).toLocaleDateString() : ''}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="tool-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!chosen.size}
          onClick={() => onPick((items ?? []).filter((i) => chosen.has(i.key)))}
        >
          <Send size={15} /> Share {chosen.size || ''} {chosen.size === 1 ? 'file' : 'files'}
        </button>
      </div>
    </section>
  );
}

function Sender({ initialName, onMessage }: { initialName: string; onMessage: (m: string) => void }) {
  const navigate = useNavigate();
  const [sender, setSender] = useState<DropSender | null>(null);
  const [nameInput, setNameInput] = useState(initialName);
  const [showQr, setShowQr] = useState(false);
  const [picking, setPicking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useTicker(sender);

  useEffect(() => {
    const next = new DropSender(initialName);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the share is an outside system created here
    setSender(next);
    void next.start();
    return () => next.close();
  }, [initialName]);

  useEffect(() => {
    if (!sender?.files.length) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [sender, sender?.files.length]);

  const link = useMemo(
    () => `${location.origin}${location.pathname}#/drop?view=${encodeURIComponent(initialName)}`,
    [initialName],
  );
  const qr = useQr(link, showQr);
  if (!sender) return null;
  const locked = sender.files.length > 0;
  const nameChanged = nameInput !== initialName;
  const ready = sender.status === 'live';

  const addFiles = (list: FileList | File[]) => {
    const files = Array.from(list);
    if (files.length) sender.add(files.map((f) => ({ blob: f, name: f.name, type: f.type })));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      onMessage('Link copied. Keep this page open while people download.');
    } catch {
      onMessage(link);
    }
  };
  const recipients = sender.peers.size;

  return (
    <>
      <section className="tool-panel drop-panel">
        <div className="drop-status" data-online={ready || undefined}>
          <span className="drop-status__dot" aria-hidden="true" />
          {sender.status === 'error'
            ? sender.error
            : !ready
              ? 'Connecting…'
              : recipients
                ? `${recipients} ${recipients === 1 ? 'person' : 'people'} connected`
                : 'Ready to share'}
        </div>
        <form
          className="drop-name"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validShareName.test(nameInput) || locked) return;
            navigate(`/drop?share=${encodeURIComponent(nameInput)}`, { replace: true });
          }}
        >
          <label>
            Share name
            <input
              value={nameInput}
              maxLength={64}
              disabled={locked}
              pattern="[A-Za-z0-9_\-]{1,64}"
              onChange={(e) => setNameInput(e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))}
            />
          </label>
          <button type="submit" className="btn btn-secondary" disabled={locked || !nameChanged || !validShareName.test(nameInput)}>
            Use this name
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={locked}
            onClick={() => navigate(`/drop?share=${randomWords()}`, { replace: true })}
          >
            New random name
          </button>
          <p className="tool-hint">
            {locked ? 'Remove all files to change the name.' : 'Anyone with the name can download what you share here, so random words are safest.'}
          </p>
        </form>

        <div
          className="drop-zone"
          data-dragging={dragging || undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <Upload size={28} aria-hidden="true" />
          <p>
            <strong>Drop files here</strong> — zips, videos, anything. They go straight from this browser to
            whoever opens your link; nothing is uploaded to a server.
          </p>
          <div className="tool-row">
            <button type="button" className="btn btn-primary" disabled={!ready || nameChanged} onClick={() => fileInput.current?.click()}>
              <FolderOpen size={16} /> Choose files
            </button>
            <button type="button" className="btn btn-secondary" disabled={!ready || nameChanged} onClick={() => setPicking(true)}>
              <Library size={16} /> From my NinjaOffice files
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            aria-label="Choose files to share"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      {picking && (
        <LibraryPicker
          onClose={() => setPicking(false)}
          onPick={async (items) => {
            setPicking(false);
            const made = await Promise.allSettled(items.map((i) => i.make()));
            const ok = made.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
            if (ok.length) sender.add(ok);
            if (ok.length < items.length) onMessage(`${items.length - ok.length} file(s) could not be read.`);
          }}
        />
      )}

      {sender.files.length > 0 && (
        <section className="tool-panel drop-panel">
          <div className="drop-link">
            <label>
              Link to send
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
            </label>
            <div className="tool-row">
              <button type="button" className="btn btn-primary" onClick={() => void copy()}>
                <ClipboardCopy size={15} /> Copy link
              </button>
              <button type="button" className="btn btn-secondary" aria-expanded={showQr} onClick={() => setShowQr((v) => !v)}>
                <QrCode size={15} /> {showQr ? 'Hide QR code' : 'QR code'}
              </button>
            </div>
            {qr && <div className="drop-qr" role="img" aria-label="QR code with the link" dangerouslySetInnerHTML={{ __html: qr }} />}
          </div>
          <div className="drop-list-head">
            <h2>
              {sender.files.length} {sender.files.length === 1 ? 'file' : 'files'} ·{' '}
              {formatBytes(sender.files.reduce((n, f) => n + f.size, 0))}
            </h2>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => [...sender.files].forEach((f) => sender.remove(f.id))}
            >
              Stop sharing all
            </button>
          </div>
          <ul className="drop-files">
            {sender.files.map((f) => {
              const sending = [...sender.transfers.values()].filter((t) => t.file.id === f.id);
              const bytes = sending.reduce((n, t) => n + t.bytes, 0);
              const pct = sending.length && f.size ? Math.min(100, Math.floor((bytes / (f.size * sending.length)) * 100)) : 0;
              return (
                <li key={f.id} className="drop-file">
                  <div className="drop-file__info">
                    <span className="drop-file__name">{f.name}</span>
                    <span className="drop-file__detail">
                      {formatBytes(f.size)}
                      {sending.length
                        ? ` · sending to ${sending.length} · ${pct}%`
                        : f.sent
                          ? ` · sent ${f.sent} ${f.sent === 1 ? 'time' : 'times'}`
                          : ' · ready'}
                    </span>
                    {sending.length > 0 && <progress max={100} value={pct} aria-label={`Sending ${f.name}`} />}
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => sender.remove(f.id)}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="tool-hint">Keep this page open until everyone has their files.</p>
        </section>
      )}
    </>
  );
}

/* ---------------- receiving ---------------- */

function Receiver({ name, onMessage }: { name: string; onMessage: (m: string) => void }) {
  const navigate = useNavigate();
  const [receiver, setReceiver] = useState<DropReceiver | null>(null);
  useTicker(receiver);
  const savedRef = useRef(new Set<string>());

  useEffect(() => {
    const next = new DropReceiver(name);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the connection is an outside system created here
    setReceiver(next);
    void next.start();
    return () => next.close();
  }, [name]);

  // Save each finished download once.
  useEffect(() => {
    if (!receiver) return;
    for (const d of receiver.downloads.values()) {
      if (d.state === 'done' && d.result && !savedRef.current.has(d.tid)) {
        savedRef.current.add(d.tid);
        // NinjaOffice files open in their app; save those only when asked.
        if (!/\.ninja\.json$/i.test(d.result.name)) saveFile(d.result);
      }
    }
  });

  if (!receiver) return null;
  const busy = [...receiver.downloads.values()].some((d) => d.state === 'requesting' || d.state === 'receiving' || d.state === 'saving');

  const get = async (file: OfferedFile) => {
    let writer: FileSystemWritableFileStream | undefined;
    const picker = (window as unknown as { showSaveFilePicker?: (o: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
    if (file.size > STREAM_TO_DISK_BYTES && picker) {
      try {
        const handle = await picker({ suggestedName: file.name });
        writer = await handle.createWritable();
      } catch {
        return; // cancelled
      }
    }
    receiver.request(file, writer);
  };

  const open = async (file: File) => {
    try {
      const target = await openReceived(file);
      if (target.href) window.open(target.href, '_blank', 'noopener');
      else if (target.route) navigate(target.route);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Could not open it.');
    }
  };

  const row = (file: OfferedFile, d: DownloadState | undefined) => {
    const pct = d && file.size ? Math.min(100, Math.floor((d.bytes / file.size) * 100)) : 0;
    const active = d && (d.state === 'requesting' || d.state === 'receiving' || d.state === 'saving');
    const app = d?.result ? opensIn(d.result) : null;
    return (
      <li key={file.id} className="drop-file">
        <div className="drop-file__info">
          <span className="drop-file__name">{file.name}</span>
          <span className="drop-file__detail">
            {formatBytes(file.size)}
            {d?.state === 'requesting' && ' · asking the sender…'}
            {d?.state === 'receiving' && ` · ${pct}% · ${formatBytes(d.rate)}/s`}
            {d?.state === 'saving' && ' · finishing…'}
            {d?.state === 'done' && (d.savedToDisk ? ' · saved' : d.result && /\.ninja\.json$/i.test(d.result.name) ? ' · received' : ' · downloaded')}
            {d?.state === 'failed' && ` · ${d.error}`}
          </span>
          {active && <progress max={100} value={pct} aria-label={`Downloading ${file.name}`} />}
        </div>
        <div className="tool-row">
          {d?.result && app && (
            <button type="button" className="btn btn-secondary" onClick={() => void open(d.result!)}>
              <ExternalLink size={15} /> Open in {app}
            </button>
          )}
          {d?.result && (
            <button type="button" className="btn btn-secondary" onClick={() => saveFile(d.result!)}>
              {/\.ninja\.json$/i.test(d.result.name) ? 'Save file' : 'Save again'}
            </button>
          )}
          {active ? (
            <button type="button" className="btn btn-secondary" onClick={() => receiver.cancel(file.id)}>
              Cancel
            </button>
          ) : (
            d?.state !== 'done' && (
              <button type="button" className="btn btn-primary" disabled={!receiver.connected} onClick={() => void get(file)}>
                <Download size={15} /> {d?.state === 'failed' ? 'Retry' : 'Download'}
              </button>
            )
          )}
          {d?.state === 'done' && <Check size={18} className="drop-done" aria-label="Done" />}
        </div>
      </li>
    );
  };

  return (
    <section className="tool-panel drop-panel">
      <div className="drop-status" data-online={receiver.connected || undefined}>
        <span className="drop-status__dot" aria-hidden="true" />
        {receiver.status === 'error'
          ? receiver.error
          : receiver.connected
            ? 'Connected to the sender'
            : receiver.status === 'connecting'
              ? 'Connecting…'
              : 'Waiting for the sender… they need to keep their NinjaDrop page open.'}
      </div>
      <div className="drop-list-head">
        <h2>
          {receiver.files.length
            ? `${receiver.files.length} ${receiver.files.length === 1 ? 'file' : 'files'} · ${formatBytes(receiver.files.reduce((n, f) => n + f.size, 0))}`
            : 'No files yet'}
        </h2>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!receiver.connected || busy || !receiver.files.some((f) => receiver.downloads.get(f.id)?.state !== 'done')}
          onClick={() => {
            for (const f of receiver.files) if (receiver.downloads.get(f.id)?.state !== 'done') void get(f);
          }}
        >
          <Download size={15} /> Download all
        </button>
      </div>
      {receiver.files.length ? (
        <ul className="drop-files">{receiver.files.map((f) => row(f, receiver.downloads.get(f.id)))}</ul>
      ) : (
        <p className="tool-muted">{receiver.connected ? 'The sender has not shared any files right now.' : 'Files appear when the sender is online.'}</p>
      )}
      <p className="tool-hint">
        Files come straight from the sender's browser over {LANES} parallel channels. Keep this page open until they finish.
      </p>
    </section>
  );
}

export default function DropPage(props: ToolProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  const share = params.get('share');
  const [message, setMessage] = useState('');

  // A bare #/drop gets four random words, kept in the address so a reload keeps the link.
  const [fresh] = useState(randomWords);
  useEffect(() => {
    if (!view && !share) navigate(`/drop?share=${fresh}`, { replace: true });
  }, [view, share, navigate, fresh]);

  const invalid = (view && !validShareName.test(view)) || (share && !validShareName.test(share));

  return (
    <ToolShell
      {...props}
      name="NinjaDrop"
      subtitle="Send files straight from your browser to anyone with the link. No uploads, no accounts, no size limit."
      status={view ? 'Receiving' : 'Sharing'}
    >
      {message && (
        <div className="tool-alert" role="status">
          {message}
        </div>
      )}
      {invalid ? (
        <div className="tool-alert" role="alert">
          This link is not valid. Ask the sender to copy it again.
        </div>
      ) : view ? (
        <>
          <Receiver key={view} name={view} onMessage={setMessage} />
          <p className="tool-hint drop-switch">
            Want to send something back? <a href="#/drop">Share your own files</a>.
          </p>
        </>
      ) : share ? (
        <Sender key={share} initialName={share} onMessage={setMessage} />
      ) : null}
    </ToolShell>
  );
}
