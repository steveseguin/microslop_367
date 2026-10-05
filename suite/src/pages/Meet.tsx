import { Suspense, lazy, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MonitorUp, Video } from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { AppMark } from '../components/AppMark';
import { DictateField } from '../components/Dictate';
import { appendSpoken } from '../utils/speech';
import { NINJA_SALT } from '../utils/ninja';
import '../styles/tools.css';
import '../styles/sync.css';

const MeetRoom = lazy(() => import('../components/MeetRoom'));

/**
 * Group video meetings, peer to peer over the VDO.Ninja SDK (no accounts). This
 * page creates a private room and its invite link; the room password keeps
 * strangers out of a room whose name they might guess. The same room also opens
 * in VDO.Ninja itself for its full studio controls.
 */
const NAME_KEY = 'officeninja_meet_name';
const randomCode = (n: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) =>
    'abcdefghijkmnpqrstuvwxyz23456789'[b % 32],
  ).join('');

function savedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export default function MeetPage(props: ToolProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const invited = params.get('room') && params.get('key')
    ? { room: params.get('room')!.replace(/[^A-Za-z0-9_]/g, ''), key: params.get('key')!.replace(/[^A-Za-z0-9]/g, '') }
    : null;
  const [name, setName] = useState(savedName);
  const [inCall, setInCall] = useState<{ room: string; key: string } | null>(null);
  const [message, setMessage] = useState('');

  const invite = (room: string, key: string) =>
    `${window.location.origin}${window.location.pathname}#/meet?room=${room}&key=${key}`;

  const start = (room: string, key: string) => {
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      /* ignore */
    }
    setInCall({ room, key });
    navigate(`/meet?room=${room}&key=${key}`, { replace: true });
  };

  const src = useMemo(() => {
    if (!inCall) return '';
    const q = new URLSearchParams({
      room: inCall.room,
      password: inCall.key,
      label: name.trim() || 'Guest',
    });
    // Same room in VDO.Ninja itself: it needs NinjaOffice's salt to find it.
    q.set('salt', NINJA_SALT);
    return `https://vdo.ninja/?${q.toString()}&screensharebutton&hidehome`;
  }, [inCall, name]);

  return (
    <ToolShell
      {...props}
      name="NinjaMeet"
      subtitle="Group video calls with screen sharing, powered by VDO.Ninja. No accounts, no downloads."
      status="Saved locally"
      compact={!!inCall}
    >
      {message && (
        <div className="tool-alert" role="status">
          {message}
        </div>
      )}
      {!inCall ? (
        <section className="tool-panel meet-setup">
          <AppMark app="meet" size="lg" />
          <h2>{invited ? 'You are invited to a meeting' : 'Start a meeting'}</h2>
          <p className="tool-muted">
            {invited
              ? 'Enter your name and join. Your browser will ask to use your camera and microphone.'
              : 'A private room is created for you. Share the invite link and people join from any browser, phone or computer.'}
          </p>
          <label>
            Your name
            <DictateField label="your name" onText={(s) => setName((v) => appendSpoken(v, s))}>
              <input
                value={name}
                autoFocus
                maxLength={40}
                placeholder="How others see you"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim())
                    start(invited?.room ?? `meet_${randomCode(14)}`, invited?.key ?? randomCode(16));
                }}
              />
            </DictateField>
          </label>
          <div className="tool-row">
            <button
              className="btn btn-primary"
              disabled={!name.trim()}
              onClick={() =>
                start(invited?.room ?? `meet_${randomCode(14)}`, invited?.key ?? randomCode(16))
              }
            >
              <Video size={16} /> {invited ? 'Join meeting' : 'Start meeting'}
            </button>
          </div>
          <p className="tool-hint">
            <MonitorUp size={13} aria-hidden="true" /> Share your screen from the call's control bar.
            Calls are peer to peer: up to 4 people are on video at once, everyone else is heard.
          </p>
        </section>
      ) : (
        <Suspense fallback={<p className="tool-muted">Starting the call…</p>}>
          <MeetRoom
            room={inCall.room}
            meetingKey={inCall.key}
            name={name.trim() || 'Guest'}
            invite={invite(inCall.room, inCall.key)}
            popOut={src}
            onMessage={setMessage}
            onLeave={() => {
              setInCall(null);
              setMessage('');
              navigate('/meet', { replace: true });
            }}
          />
        </Suspense>
      )}
    </ToolShell>
  );
}
