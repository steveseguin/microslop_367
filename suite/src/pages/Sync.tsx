import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardCopy,
  Download,
  FolderOpen,
  HardDriveDownload,
  Laptop,
  Link2,
  RefreshCw,
  Smartphone,
  Unplug,
  Upload,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { DictateField } from '../components/Dictate';
import { appendSpoken } from '../utils/speech';
import { downloadFile } from '../utils/toolStorage';
import {
  backupFileName,
  isEncryptedBackup,
  lastBackup,
  makeBackup,
  markBackedUp,
  readBackup,
} from '../utils/sync/backupFile';
import { applySnapshot, describeReport, deviceInfo, renameDevice } from '../utils/sync/snapshot';
import {
  createGroup,
  joinGroup,
  leaveGroup,
  onSyncStatus,
  pairingCode,
  pairingLink,
  parsePairingCode,
  startSync,
  stopSync,
  syncGroup,
  syncNow,
} from '../utils/sync/p2p';
import type { SyncGroup, SyncStatus } from '../utils/sync/p2p';
import {
  chooseFolder,
  folderPermission,
  folderSupported,
  forgetFolder,
  savedFolder,
} from '../utils/sync/folder';
import { folderState, syncFolderNow } from '../utils/sync/background';
import type { FolderState } from '../utils/sync/background';
import '../styles/tools.css';
import '../styles/sync.css';

const ago = (t: number | null | undefined) => {
  if (!t) return 'never';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};

const STATE_TEXT: Record<SyncStatus['state'], string> = {
  off: 'Off',
  waiting: 'Another OfficeNinja tab in this browser is syncing',
  connecting: 'Connecting…',
  live: 'Online, waiting for your other devices',
  error: 'Could not connect',
  unsupported: 'Not supported in this browser',
};

export default function SyncPage(props: ToolProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [group, setGroup] = useState<SyncGroup | null>(() => syncGroup());
  const [qr, setQr] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [device, setDevice] = useState(() => deviceInfo().name);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [restoreText, setRestoreText] = useState<{ text: string; name: string } | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [folder, setFolder] = useState<{ name: string; permission: string } | null>(null);
  const [fstate, setFstate] = useState<FolderState | null>(() => folderState());
  const [backupInfo, setBackupInfo] = useState(() => lastBackup());
  const restoreInput = useRef<HTMLInputElement>(null);

  const pending = parsePairingCode(new URLSearchParams(location.search).get('pair') ?? '');
  const pendingIsNew = pending && pending.room !== group?.room;

  useEffect(() => onSyncStatus(setStatus), []);

  useEffect(() => {
    const refresh = () => {
      setFstate(folderState());
      setBackupInfo(lastBackup());
    };
    window.addEventListener('officeninja-folder', refresh);
    const tick = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener('officeninja-folder', refresh);
      window.clearInterval(tick);
    };
  }, []);

  const refreshFolder = async () => {
    const handle = await savedFolder();
    setFolder(handle ? { name: handle.name, permission: await folderPermission(handle) } : null);
  };
  useEffect(() => {
    void refreshFolder();
  }, []);

  useEffect(() => {
    if (!group) {
      setQr('');
      return;
    }
    let live = true;
    void import('qrcode-generator').then(({ default: qrcode }) => {
      const code = qrcode(0, 'M');
      code.addData(pairingLink(group));
      code.make();
      if (live) setQr(code.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
    });
    return () => {
      live = false;
    };
  }, [group]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied the ${what}.`);
    } catch {
      setMessage(`Select the ${what} and copy it.`);
    }
  };

  const setUp = () => {
    stopSync();
    setGroup(createGroup());
    void startSync();
    setMessage('Device sync is on. Open the link or scan the code on your other devices.');
  };

  const join = (g: SyncGroup) => {
    stopSync();
    joinGroup(g);
    setGroup(g);
    void startSync();
    navigate('/sync', { replace: true });
    setMessage('Joined. Your devices sync whenever OfficeNinja is open on two of them.');
  };

  const leave = () => {
    stopSync();
    leaveGroup();
    setGroup(null);
    setMessage('This device left the sync group. Your files here are unchanged.');
  };

  const dot = status?.state === 'live' ? (status.peers.length ? 'on' : 'idle') : status?.state === 'error' ? 'bad' : 'off';

  return (
    <ToolShell
      {...props}
      name="NinjaSync"
      subtitle="No accounts and no cloud of ours: sync devices directly over VDO.Ninja, keep a backup in a folder, or save a backup file."
      status={busy ? 'Working…' : 'Saved locally'}
    >
      {message && (
        <div className="tool-alert" role="status">
          {message}
        </div>
      )}
      {pending && pendingIsNew && (
        <section className="tool-panel sync-invite" aria-label="Join sync group">
          <h2>Sync this device with your others?</h2>
          <p className="tool-muted">
            This link connects this browser to a private sync group. Files are merged in both
            directions; nothing here is deleted. Only join links from your own devices.
            {group ? ' This device will leave its current sync group.' : ''}
          </p>
          <div className="tool-row">
            <button className="btn btn-primary" onClick={() => join(pending)}>
              <Link2 size={16} /> Join and sync
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/sync', { replace: true })}>
              Not now
            </button>
          </div>
        </section>
      )}

      <div className="sync-grid">
        <section className="tool-panel sync-card" aria-labelledby="sync-p2p">
          <header className="sync-card__head">
            <span className="sync-icon" aria-hidden="true">
              <Smartphone size={18} />
              <Laptop size={18} />
            </span>
            <div>
              <h2 id="sync-p2p">Sync your devices</h2>
              <p className="tool-muted">
                Peer to peer over VDO.Ninja. Encrypted, nothing stored on a server. Devices sync
                while OfficeNinja is open on at least two of them.
              </p>
            </div>
          </header>
          {!group ? (
            <>
              <button className="btn btn-primary" onClick={setUp}>
                <RefreshCw size={16} /> Set up device sync
              </button>
              <div className="sync-join">
                <label>
                  Already set up on another device? Paste its sync link or code
                  <input
                    value={joinCode}
                    placeholder="https://…#/sync?pair=… or onsync_…~…"
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </label>
                <button
                  className="btn btn-secondary"
                  disabled={!parsePairingCode(decodeURIComponent(joinCode))}
                  onClick={() => {
                    const g = parsePairingCode(decodeURIComponent(joinCode));
                    if (g) join(g);
                  }}
                >
                  Join
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="sync-status">
                <span className={`sync-dot sync-dot--${dot}`} aria-hidden="true" />
                {status?.state === 'live' && status.peers.length
                  ? `Syncing with ${status.peers.length} device${status.peers.length === 1 ? '' : 's'}`
                  : STATE_TEXT[status?.state ?? 'off']}
                {status?.error ? ` · ${status.error}` : ''}
              </p>
              {!!status?.peers.length && (
                <ul className="sync-peers">
                  {status.peers.map((p) => (
                    <li key={p.uuid}>{p.name}</li>
                  ))}
                </ul>
              )}
              {status?.lastSync && (
                <p className="tool-hint">
                  Last sync {ago(status.lastSync)}: {status.lastResult}
                </p>
              )}
              <div className="sync-pair">
                {qr && (
                  <div
                    className="sync-qr"
                    role="img"
                    aria-label="QR code with the sync link"
                    dangerouslySetInnerHTML={{ __html: qr }}
                  />
                )}
                <div className="sync-pair__text">
                  <p>
                    <strong>Add a device:</strong> scan this code with a phone, or open the link on
                    another computer.
                  </p>
                  <div className="tool-row">
                    <button className="btn btn-secondary" onClick={() => void copy(pairingLink(group), 'sync link')}>
                      <ClipboardCopy size={15} /> Copy link
                    </button>
                    <button className="btn btn-secondary" onClick={() => void copy(pairingCode(group), 'sync code')}>
                      Copy code
                    </button>
                  </div>
                  <p className="tool-hint">
                    Anyone with this link can sync with your files. Share it only with your own
                    devices.
                  </p>
                </div>
              </div>
              <label>
                This device's name
                <DictateField
                  label="device name"
                  onText={(s) => {
                    const next = appendSpoken(device, s);
                    setDevice(next);
                    renameDevice(next);
                  }}
                >
                  <input
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    onBlur={() => setDevice(renameDevice(device).name)}
                  />
                </DictateField>
              </label>
              <div className="tool-row">
                <button
                  className="btn btn-primary"
                  disabled={status?.state !== 'live' || !status.peers.length}
                  onClick={() => {
                    syncNow();
                    setMessage('Comparing with your other devices…');
                  }}
                >
                  <RefreshCw size={15} /> Sync now
                </button>
                {status?.state === 'error' && (
                  <button className="btn btn-secondary" onClick={() => void startSync()}>
                    Try again
                  </button>
                )}
                <button className="btn btn-secondary" onClick={leave}>
                  <Unplug size={15} /> Stop syncing this device
                </button>
              </div>
            </>
          )}
        </section>

        <section className="tool-panel sync-card" aria-labelledby="sync-folder">
          <header className="sync-card__head">
            <span className="sync-icon" aria-hidden="true">
              <FolderOpen size={18} />
            </span>
            <div>
              <h2 id="sync-folder">Back up to a folder</h2>
              <p className="tool-muted">
                Choose a folder inside Dropbox, OneDrive, iCloud Drive or Google Drive on this
                computer and their app uploads the backup for you. OfficeNinja saves there
                automatically and merges changes from other computers using the same folder.
              </p>
            </div>
          </header>
          {!folderSupported() ? (
            <p className="tool-hint">
              Folder backup needs Chrome or Edge on a desktop computer. Use device sync or a
              backup file here instead.
            </p>
          ) : !folder ? (
            <button
              className="btn btn-primary"
              onClick={() =>
                void run(async () => {
                  try {
                    await chooseFolder();
                  } catch {
                    return; // picker cancelled
                  }
                  await refreshFolder();
                  const result = await syncFolderNow(true);
                  setMessage(
                    result === 'ok'
                      ? 'Backup saved to the folder. It will stay up to date while OfficeNinja is open.'
                      : 'The folder could not be written. Try another folder.',
                  );
                })
              }
            >
              <FolderOpen size={16} /> Choose a folder
            </button>
          ) : (
            <>
              <p className="sync-status">
                <span
                  className={`sync-dot sync-dot--${folder.permission === 'granted' ? 'on' : 'idle'}`}
                  aria-hidden="true"
                />
                Folder “{folder.name}”
                {folder.permission === 'granted'
                  ? ` · saved ${ago(fstate?.lastWrite)}`
                  : ' · the browser needs your OK to keep using it'}
              </p>
              {fstate?.lastResult && <p className="tool-hint">Last merge: {fstate.lastResult}</p>}
              <div className="tool-row">
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await syncFolderNow(true);
                      await refreshFolder();
                      setMessage(
                        result === 'ok'
                          ? 'Folder backup is up to date.'
                          : result === 'needs-permission'
                            ? 'Access to the folder was not allowed.'
                            : 'The folder could not be written.',
                      );
                    })
                  }
                >
                  {folder.permission === 'granted' ? (
                    <>
                      <RefreshCw size={15} /> Save now
                    </>
                  ) : (
                    'Allow access'
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    void run(async () => {
                      try {
                        await chooseFolder();
                      } catch {
                        return;
                      }
                      await refreshFolder();
                      await syncFolderNow(true);
                    })
                  }
                >
                  Change folder
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    void run(async () => {
                      await forgetFolder();
                      await refreshFolder();
                      setMessage('Folder backup turned off. The files already in the folder are kept.');
                    })
                  }
                >
                  Stop
                </button>
              </div>
            </>
          )}
        </section>

        <section className="tool-panel sync-card" aria-labelledby="sync-file">
          <header className="sync-card__head">
            <span className="sync-icon" aria-hidden="true">
              <HardDriveDownload size={18} />
            </span>
            <div>
              <h2 id="sync-file">Backup file</h2>
              <p className="tool-muted">
                Everything in one file: documents, spreadsheets, slides, designs, notes, time and
                invoices, and your PDF, photo and SVG drafts. Restoring merges; it never deletes.
              </p>
            </div>
          </header>
          <p className="tool-hint">Last backup: {backupInfo ? `${ago(backupInfo.t)} (${backupInfo.where})` : 'never'}</p>
          <label>
            Password (optional, encrypts the file)
            <input
              type="password"
              autoComplete="new-password"
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Leave empty for an unencrypted backup"
            />
          </label>
          <div className="tool-row">
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const { blob, snapshot } = await makeBackup(backupPassword || undefined);
                  downloadFile(backupFileName(), blob, 'application/json');
                  markBackedUp('backup file');
                  setBackupInfo(lastBackup());
                  setMessage(
                    `Backup saved with ${snapshot.items.length} item${snapshot.items.length === 1 ? '' : 's'}${backupPassword ? ', encrypted' : ''}.`,
                  );
                })
              }
            >
              <Download size={15} /> Download backup
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => restoreInput.current?.click()}>
              <Upload size={15} /> Restore from a backup
            </button>
            <input
              ref={restoreInput}
              type="file"
              hidden
              accept=".json,application/json"
              aria-label="Backup file to restore"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                void run(async () => {
                  const text = await file.text();
                  if (isEncryptedBackup(text)) {
                    setRestoreText({ text, name: file.name });
                    setRestorePassword('');
                    setMessage('This backup is encrypted. Enter its password to restore it.');
                    return;
                  }
                  const report = await applySnapshot(await readBackup(text));
                  setMessage(`Restored ${file.name}: ${describeReport(report)}.`);
                });
              }}
            />
          </div>
          {restoreText && (
            <form
              className="sync-join"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const report = await applySnapshot(await readBackup(restoreText.text, restorePassword));
                  setMessage(`Restored ${restoreText.name}: ${describeReport(report)}.`);
                  setRestoreText(null);
                });
              }}
            >
              <label>
                Password for {restoreText.name}
                <input
                  type="password"
                  autoFocus
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                />
              </label>
              <button className="btn btn-primary" type="submit" disabled={!restorePassword || busy}>
                Restore
              </button>
            </form>
          )}
        </section>
      </div>
    </ToolShell>
  );
}
