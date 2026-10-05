import { useEffect, useRef, useState } from 'react';
import {
  ClipboardCopy,
  ExternalLink,
  LogOut,
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  Pin,
  PinOff,
  Video,
  VideoOff,
} from 'lucide-react';
import { MAX_VIDEO, MeetCall } from '../utils/meet/call';
import type { Person } from '../utils/meet/call';

function Media({ stream, kind, muted, mirrored }: { stream: MediaStream | null; kind: 'video' | 'audio'; muted?: boolean; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.srcObject === stream) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => {});
  }, [stream]);
  return kind === 'video' ? (
    <video ref={ref} autoPlay playsInline muted className={mirrored ? 'meet-video meet-video--mirror' : 'meet-video'} />
  ) : (
    <audio ref={ref} autoPlay muted={muted} />
  );
}

const initial = (name: string) => name.trim().slice(0, 1).toUpperCase() || '?';

function Tile({ person, onPin }: { person: Person; onPin: () => void }) {
  const hasVideo = person.stream.getVideoTracks().some((t) => t.readyState === 'live') && person.cam;
  return (
    <figure className={`meet-tile${person.speaking ? ' meet-tile--speaking' : ''}`}>
      {hasVideo ? <Media stream={person.stream} kind="video" /> : <span className="meet-tile__avatar">{initial(person.name)}</span>}
      <figcaption>
        {!person.mic && <MicOff size={13} aria-label="Muted" />}
        {person.name}
      </figcaption>
      <button
        type="button"
        className="meet-tile__pin"
        aria-label={person.pinned ? `Unpin ${person.name}` : `Keep ${person.name} on screen`}
        title={person.pinned ? 'Unpin' : 'Keep on screen'}
        onClick={onPin}
      >
        {person.pinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
    </figure>
  );
}

/** The native NinjaMeet call: up to four people on video, everyone else audio-only. */
export default function MeetRoom({
  room,
  meetingKey,
  name,
  invite,
  popOut,
  onLeave,
  onMessage,
}: {
  room: string;
  meetingKey: string;
  name: string;
  invite: string;
  popOut: string;
  onLeave: () => void;
  onMessage: (text: string) => void;
}) {
  const [call, setCall] = useState<MeetCall | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const next = new MeetCall(room, meetingKey, name);
    const onChange = () => setTick((n) => n + 1);
    next.addEventListener('change', onChange);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the call is an outside system created here
    setCall(next);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__meet = next;
    void next.start();
    return () => {
      next.removeEventListener('change', onChange);
      next.leave();
    };
  }, [room, meetingKey, name]);

  if (!call) return null;
  const people = [...call.people.values()];
  const onStage = people.filter((p) => p.video);
  const audioOnly = people.filter((p) => !p.video);
  const count = people.length + 1;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite);
      onMessage('Invite link copied. Anyone with it can join this meeting.');
    } catch {
      onMessage(`Invite link: ${invite}`);
    }
  };

  return (
    <section className="meet-room" aria-label="Meeting">
      <div className="meet-bar">
        <strong>
          Meeting · {count} {count === 1 ? 'person' : 'people'}
          {call.status === 'connecting' && ' · connecting…'}
        </strong>
        <div className="tool-row">
          <button className="btn btn-primary" onClick={() => void copy()}>
            <ClipboardCopy size={15} /> Copy invite link
          </button>
          <a className="btn btn-secondary" href={popOut} target="_blank" rel="noopener noreferrer" title="Open this meeting in VDO.Ninja for its full studio controls">
            <ExternalLink size={15} /> Open in VDO.Ninja
          </a>
        </div>
      </div>

      {call.status === 'error' && (
        <div className="tool-alert" role="alert">
          {call.error}
        </div>
      )}
      {!call.local && call.status !== 'error' && (
        <div className="tool-alert" role="status">
          No camera or microphone is available, so you are listening and watching only. Check your
          browser's permission for this site to join with them.
        </div>
      )}

      <div className={`meet-stage meet-stage--${Math.min(onStage.length + 1, MAX_VIDEO + 1)}`}>
        <figure className={`meet-tile meet-tile--me${call.speaking ? ' meet-tile--speaking' : ''}`}>
          {call.preview && (call.cam || call.sharing) ? (
            <Media stream={call.preview} kind="video" mirrored={!call.sharing} />
          ) : (
            <span className="meet-tile__avatar">{initial(call.name)}</span>
          )}
          <figcaption>
            {!call.mic && <MicOff size={13} aria-label="Muted" />}
            {call.name} (you){call.sharing ? ' · sharing screen' : ''}
          </figcaption>
        </figure>
        {onStage.map((p) => (
          <Tile key={p.streamID} person={p} onPin={() => call.setVideo(p.streamID, !p.pinned)} />
        ))}
      </div>

      {audioOnly.length > 0 && (
        <div className="meet-audio" aria-label="Listening (audio only)">
          <span className="meet-audio__label">
            Audio only · video is shown for {MAX_VIDEO} people at a time, and whoever talks comes on screen
          </span>
          <ul>
            {audioOnly.map((p) => (
              <li key={p.streamID} className={p.speaking ? 'meet-chip meet-chip--speaking' : 'meet-chip'}>
                <span className="meet-chip__avatar">{initial(p.name)}</span>
                <span className="meet-chip__name">
                  {!p.mic && <MicOff size={12} aria-label="Muted" />} {p.name}
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => call.setVideo(p.streamID, true)}>
                  Show video
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Everyone is heard, on screen or not. */}
      <div hidden>
        {people.map((p) => (
          <Media key={p.streamID} stream={p.stream} kind="audio" />
        ))}
      </div>

      <div className="meet-controls" role="toolbar" aria-label="Call controls">
        <button
          type="button"
          className={call.mic ? 'btn btn-secondary' : 'btn btn-danger'}
          aria-pressed={!call.mic}
          disabled={!call.local?.getAudioTracks().length}
          onClick={() => call.toggleMic()}
        >
          {call.mic ? <Mic size={16} /> : <MicOff size={16} />} {call.mic ? 'Mute' : 'Unmute'}
        </button>
        <button
          type="button"
          className={call.cam ? 'btn btn-secondary' : 'btn btn-danger'}
          aria-pressed={!call.cam}
          disabled={!call.local?.getVideoTracks().length && !call.sharing}
          onClick={() => call.toggleCam()}
        >
          {call.cam ? <Video size={16} /> : <VideoOff size={16} />} {call.cam ? 'Stop video' : 'Start video'}
        </button>
        {typeof navigator.mediaDevices?.getDisplayMedia === 'function' && (
          <button
            type="button"
            className="btn btn-secondary"
            aria-pressed={call.sharing}
            disabled={!call.local || call.status !== 'live'}
            onClick={() => void call.shareScreen()}
          >
            {call.sharing ? <MonitorX size={16} /> : <MonitorUp size={16} />} {call.sharing ? 'Stop sharing' : 'Share screen'}
          </button>
        )}
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            call.leave();
            onLeave();
          }}
        >
          <LogOut size={16} /> Leave
        </button>
      </div>
    </section>
  );
}
