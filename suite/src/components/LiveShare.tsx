import { useEffect, useState } from 'react';
import { Eye, PencilLine, Radio, Users, X } from 'lucide-react';
import { liveLink } from '../utils/live/session';
import type { LiveInfo, LiveSession } from '../utils/live/session';
import '../styles/live.css';

/** Who is here, live. */
function useLivePeers(session: LiveSession | null) {
  const [, bump] = useState(0);
  useEffect(() => {
    if (!session) return;
    const sync = () => bump((n) => n + 1);
    session.addEventListener('peers', sync);
    session.addEventListener('status', sync);
    return () => {
      session.removeEventListener('peers', sync);
      session.removeEventListener('status', sync);
    };
  }, [session]);
  return {
    peers: session ? [...session.peers.values()] : [],
    status: session?.status ?? 'closed',
  };
}

/** Small row of avatars for the header. */
export function LiveAvatars({ session, onClick }: { session: LiveSession | null; onClick?: () => void }) {
  const { peers, status } = useLivePeers(session);
  if (!session) return null;
  return (
    <button
      type="button"
      className="live-avatars"
      onClick={onClick}
      title={status === 'live' ? `${peers.length + 1} here: you${peers.map((p) => `, ${p.name}`).join('')}` : 'Connecting…'}
      aria-label={`Live: ${peers.length + 1} people here`}
    >
      <span className={`live-avatars__dot live-avatars__dot--${status}`} aria-hidden="true" />
      {[session.me, ...peers].slice(0, 4).map((p, i) => (
        <span key={i} className="live-avatar" style={{ background: p.color }} aria-hidden="true">
          {p.name.slice(0, 1).toUpperCase()}
        </span>
      ))}
      {peers.length > 3 && <span className="live-avatar live-avatar--more">+{peers.length - 3}</span>}
    </button>
  );
}

/**
 * The Share panel: copy an edit or view-only link, see who is here, stop.
 * `start` begins sharing the open file (resolves to null if it could not).
 */
export function SharePanel({
  session,
  route,
  start,
  stop,
  onClose,
  guest,
}: {
  session: LiveSession | null;
  /** App route the links open, e.g. '/word'. */
  route: string;
  start: () => Promise<LiveInfo | null>;
  stop: () => void;
  onClose: () => void;
  guest: boolean;
}) {
  const { peers, status } = useLivePeers(session);
  const [note, setNote] = useState('');
  const copy = async (which: 'edit' | 'view') => {
    const info = session && session.status !== 'error' ? session.info : await start();
    if (!info) {
      setNote('Could not start sharing. Check your connection and try again.');
      return;
    }
    const link = liveLink(route, info, which === 'edit');
    try {
      await navigator.clipboard.writeText(link);
      setNote(
        which === 'edit'
          ? 'Edit link copied. Anyone with it can change this file while it is shared.'
          : 'View-only link copied. People with it see your changes live but cannot edit.',
      );
    } catch {
      setNote(link);
    }
  };
  return (
    <section className="live-panel" role="dialog" aria-label="Share live">
      <header>
        <h2>
          <Radio size={16} aria-hidden="true" /> {guest ? 'Live session' : 'Share live'}
        </h2>
        <button type="button" className="btn btn-secondary btn-icon" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      {!guest && (
        <p className="live-panel__lead">
          People open the link in any browser, no account needed. Changes and cursors appear
          live for everyone. Keep this file open while you share it.
        </p>
      )}
      {!guest && (
        <div className="live-panel__links">
          <button type="button" className="btn btn-primary" onClick={() => void copy('edit')}>
            <PencilLine size={15} /> Copy edit link
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void copy('view')}>
            <Eye size={15} /> Copy view-only link
          </button>
        </div>
      )}
      {note && <p className="live-panel__note">{note}</p>}
      {session && (
        <>
          <p className="live-panel__status">
            <Users size={14} aria-hidden="true" />{' '}
            {status === 'live'
              ? peers.length
                ? `${peers.length + 1} people here`
                : 'Live. Waiting for people to open the link.'
              : status === 'error'
                ? session.error || 'Could not connect.'
                : 'Connecting…'}
          </p>
          <ul className="live-panel__people">
            <li>
              <span className="live-avatar" style={{ background: session.me.color }}>
                {session.me.name.slice(0, 1).toUpperCase()}
              </span>
              {session.me.name} (you){session.mode === 'view' ? ' · viewing' : ''}
            </li>
            {peers.map((p) => (
              <li key={p.uuid}>
                <span className="live-avatar" style={{ background: p.color }}>
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                {p.name}
                {p.mode === 'view' ? ' · viewing' : ' · editing'}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary" onClick={stop}>
            {guest ? 'Leave session' : 'Stop sharing'}
          </button>
        </>
      )}
    </section>
  );
}
