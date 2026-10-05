import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  ClipboardCopy,
  Hash,
  LogOut,
  Menu,
  MessagesSquare,
  Plus,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { AppMark } from '../components/AppMark';
import { DictateField } from '../components/Dictate';
import { appendSpoken } from '../utils/speech';
import { randomWords } from '../utils/words';
import {
  GENERAL,
  cleanChannel,
  forgetSpace,
  getSpace,
  myNick,
  rememberSpace,
  savedSpaces,
  setActiveSpace,
  setMyNick,
  setViewing,
  validSpace,
} from '../utils/chat/engine';
import type { ChatMessage, ChatSpace } from '../utils/chat/engine';
import '../styles/tools.css';
import '../styles/chat.css';

function useSpace(space: ChatSpace | null) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!space) return;
    const bump = () => setTick((n) => n + 1);
    space.addEventListener('change', bump);
    return () => space.removeEventListener('change', bump);
  }, [space]);
}

const inviteLink = (space: string) => `${location.origin}${location.pathname}#/chat?space=${encodeURIComponent(space)}`;

/* ---------------- message text: links and @mentions, never HTML ---------------- */

function renderText(text: string, me: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]'])|(@[A-Za-z0-9_.-]{1,32})/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[1]) {
      out.push(
        <a key={i++} href={match[1]} target="_blank" rel="noopener noreferrer nofollow">
          {match[1]}
        </a>,
      );
    } else {
      const self = match[2].slice(1).toLowerCase() === me.toLowerCase();
      out.push(
        <span key={i++} className={self ? 'chat-mention chat-mention--me' : 'chat-mention'}>
          {match[2]}
        </span>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const day = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};
const hue = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 42%)`;
};

/* ---------------- first visit / join ---------------- */

function Setup({ invited, onDone, onCancel }: { invited: string; onDone: (space: string) => void; onCancel?: () => void }) {
  const [nick, setNick] = useState(myNick());
  const [space, setSpace] = useState(invited);
  const [mode, setMode] = useState<'new' | 'join'>(invited ? 'join' : 'new');
  const valid = nick.trim() && (mode === 'new' || validSpace.test(space.trim()));
  const go = () => {
    if (!valid) return;
    setMyNick(nick);
    const name = mode === 'new' ? randomWords() : space.trim();
    rememberSpace(name);
    onDone(name);
  };
  return (
    <section className="tool-panel chat-setup">
      <AppMark app="chat" size="lg" />
      <h2>{invited ? `Join the ${invited} space` : 'Chat in open channels'}</h2>
      <p className="tool-muted">
        A space is a group of public channels that anyone with its name can join. There are no private
        channels: everyone can see, join and leave every channel. Messages go peer to peer and are kept on
        each member's device.
      </p>
      <label>
        Your name
        <input value={nick} maxLength={32} autoFocus placeholder="How others see you" onChange={(e) => setNick(e.target.value)} />
      </label>
      {!invited && (
        <div className="chat-setup__modes" role="radiogroup" aria-label="Space">
          <label>
            <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} /> Start a new space
          </label>
          <label>
            <input type="radio" checked={mode === 'join'} onChange={() => setMode('join')} /> Join a space by name
          </label>
        </div>
      )}
      {mode === 'join' && (
        <label>
          Space name
          <input
            value={space}
            maxLength={64}
            placeholder="e.g. maple-otter-quartz-dawn"
            onChange={(e) => setSpace(e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && go()}
          />
        </label>
      )}
      <div className="tool-row">
        <button type="button" className="btn btn-primary" disabled={!valid} onClick={go}>
          <MessagesSquare size={16} /> {mode === 'new' ? 'Create space' : 'Join space'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------------- channel browser ---------------- */

function ChannelBrowser({ space, onOpen, onClose }: { space: ChatSpace; onOpen: (ch: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const joined = space.prefs.joined;
  const members = (ch: string) => [...space.peers.values()].filter((p) => p.joined.includes(ch)).length + (joined.includes(ch) ? 1 : 0);
  const list = [...space.channels.values()]
    .filter((c) => c.name.includes(cleanChannel(query) || query.toLowerCase()))
    .sort((a, b) => members(b.name) - members(a.name) || a.name.localeCompare(b.name));
  return (
    <section className="chat-browser" role="dialog" aria-label="All channels">
      <header>
        <h2>Channels in {space.name}</h2>
        <button type="button" className="btn btn-secondary btn-icon" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      <form
        className="chat-browser__new"
        onSubmit={(e) => {
          e.preventDefault();
          const name = space.createChannel(newName);
          if (name) {
            setNewName('');
            onOpen(name);
          }
        }}
      >
        <label className="sr-only" htmlFor="chat-new-channel">
          New channel name
        </label>
        <input id="chat-new-channel" value={newName} maxLength={32} placeholder="new-channel-name" onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" className="btn btn-primary" disabled={!cleanChannel(newName)}>
          <Plus size={15} /> Create
        </button>
      </form>
      <div className="chat-browser__search">
        <Search size={15} aria-hidden="true" />
        <input type="search" aria-label="Find a channel" placeholder="Find a channel" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ul>
        {list.map((c) => {
          const isIn = joined.includes(c.name);
          return (
            <li key={c.name}>
              <button type="button" className="chat-browser__name" onClick={() => onOpen(c.name)}>
                <Hash size={14} aria-hidden="true" />
                {c.name}
              </button>
              <span className="chat-browser__meta">
                {members(c.name)} here{c.topic ? ` · ${c.topic}` : ''}
              </span>
              {c.name !== GENERAL &&
                (isIn ? (
                  <button type="button" className="btn btn-secondary" onClick={() => space.leave(c.name)}>
                    Leave
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => (space.join(c.name), onOpen(c.name))}>
                    Join
                  </button>
                ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------- the chat ---------------- */

function Room({
  space,
  spaces,
  channel,
  onChannel,
  onSpace,
  onAddSpace,
  onMessage,
}: {
  space: ChatSpace;
  spaces: string[];
  channel: string;
  onChannel: (ch: string) => void;
  onSpace: (name: string) => void;
  onAddSpace: () => void;
  onMessage: (text: string) => void;
}) {
  useSpace(space);
  const [draft, setDraft] = useState('');
  const [browsing, setBrowsing] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState(space.nick);
  const listRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastTyping = useRef({ ch: '', at: 0 });
  const prefs = space.prefs;
  const messages = space.messages.get(channel) ?? [];
  const joinedHere = prefs.joined.includes(channel);
  const meta = space.channels.get(channel);
  const here = [...space.peers.values()].filter((p) => p.joined.includes(channel));
  const typing = [...space.peers.values()].filter((p) => p.typing?.ch === channel);

  useEffect(() => {
    setViewing({ space: space.name, ch: channel });
    return () => setViewing(null);
  }, [space, channel]);

  // Read what is on screen; keep the view pinned to the newest message.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
    if (!document.hidden && stickRef.current) space.markRead(channel);
  });
  useEffect(() => {
    stickRef.current = true;
  }, [channel]);
  useEffect(() => {
    const onVisible = () => !document.hidden && stickRef.current && space.markRead(channel);
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [space, channel]);

  const send = () => {
    if (!draft.trim()) return;
    if (!joinedHere) space.join(channel);
    space.post(channel, draft);
    setDraft('');
    stickRef.current = true;
  };

  const toggleBell = async () => {
    if (!prefs.bell && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    if (!prefs.bell && typeof Notification !== 'undefined' && Notification.permission === 'denied')
      onMessage('Notifications are blocked for this site in your browser settings.');
    space.setBell(!prefs.bell);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink(space.name));
      onMessage('Invite link copied. Anyone with it can join this space and all its channels.');
    } catch {
      onMessage(inviteLink(space.name));
    }
  };

  const joinedChannels = prefs.joined.filter((c) => space.channels.has(c) || c === GENERAL);
  if (!joinedChannels.includes(channel) && space.channels.has(channel)) joinedChannels.push(channel);

  return (
    <div className="chat-layout" data-drawer={drawer || undefined}>
      <aside className="chat-side" aria-label="Spaces and channels">
        <div className="chat-side__space">
          <label className="sr-only" htmlFor="chat-space">
            Space
          </label>
          <select id="chat-space" value={space.name} onChange={(e) => (e.target.value === '+' ? onAddSpace() : onSpace(e.target.value))}>
            {spaces.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="+">+ Add or join a space…</option>
          </select>
          <div className="chat-side__status" data-live={space.status === 'live' || undefined}>
            <span aria-hidden="true" />
            {space.status === 'live'
              ? `${space.peers.size + 1} online`
              : space.status === 'error'
                ? space.error || 'Offline'
                : 'Connecting…'}
          </div>
          <div className="tool-row chat-side__actions">
            <button type="button" className="btn btn-secondary btn-icon" title="Copy invite link" aria-label="Copy invite link" onClick={() => void copyInvite()}>
              <ClipboardCopy size={15} />
            </button>
            <button
              type="button"
              className={prefs.bell ? 'btn btn-primary btn-icon' : 'btn btn-secondary btn-icon'}
              aria-pressed={prefs.bell}
              title={prefs.bell ? 'Notifications on for your channels and @mentions' : 'Turn on notifications'}
              aria-label={prefs.bell ? 'Turn off notifications' : 'Turn on notifications'}
              onClick={() => void toggleBell()}
            >
              {prefs.bell ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              title="Leave this space"
              aria-label="Leave this space"
              onClick={() => {
                forgetSpace(space.name);
                onSpace('');
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
        <div className="chat-side__head">
          <span>Channels</span>
          <button type="button" className="btn btn-secondary btn-icon" aria-label="Browse or create channels" title="Browse or create channels" onClick={() => setBrowsing(true)}>
            <Plus size={15} />
          </button>
        </div>
        <ul className="chat-channels">
          {joinedChannels.map((c) => {
            const unread = c === channel ? 0 : space.unread(c);
            return (
              <li key={c}>
                <button
                  type="button"
                  aria-current={c === channel ? 'page' : undefined}
                  className={unread ? 'chat-channel chat-channel--unread' : 'chat-channel'}
                  onClick={() => {
                    onChannel(c);
                    setDrawer(false);
                  }}
                >
                  <Hash size={14} aria-hidden="true" /> <span>{c}</span>
                  {unread > 0 && <span className="chat-badge">{unread > 99 ? '99+' : unread}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-secondary chat-side__browse" onClick={() => setBrowsing(true)}>
          Browse all channels
        </button>
        <div className="chat-side__me">
          {editingNick ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                space.rename(nickDraft);
                setEditingNick(false);
              }}
            >
              <input aria-label="Your name" value={nickDraft} maxLength={32} autoFocus onChange={(e) => setNickDraft(e.target.value)} />
            </form>
          ) : (
            <button type="button" className="chat-side__nick" title="Change your name" onClick={() => setEditingNick(true)}>
              <span className="chat-avatar" style={{ background: hue(space.nick) }}>
                {space.nick.slice(0, 1).toUpperCase()}
              </span>
              {space.nick}
            </button>
          )}
        </div>
      </aside>

      <section className="chat-main" aria-label={`#${channel}`}>
        <header className="chat-main__head">
          <button type="button" className="btn btn-secondary btn-icon chat-drawer-toggle" aria-label="Channels" onClick={() => setDrawer((v) => !v)}>
            <Menu size={16} />
          </button>
          <h2>
            <Hash size={18} aria-hidden="true" />
            {channel}
          </h2>
          {meta?.topic && <span className="chat-main__topic">{meta.topic}</span>}
          <span className="chat-main__count" title={[space.nick, ...here.map((p) => p.nick)].join(', ')}>
            <Users size={14} aria-hidden="true" /> {here.length + (joinedHere ? 1 : 0)}
          </span>
          {channel !== GENERAL &&
            (joinedHere ? (
              <button type="button" className="btn btn-secondary" onClick={() => (space.leave(channel), onChannel(GENERAL))}>
                Leave
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => space.join(channel)}>
                Join
              </button>
            ))}
        </header>
        <div
          className="chat-messages"
          ref={listRef}
          role="log"
          aria-live="polite"
          aria-label={`Messages in #${channel}`}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            if (stickRef.current) space.markRead(channel);
          }}
        >
          {!messages.length && (
            <div className="chat-empty">
              <Hash size={28} aria-hidden="true" />
              <p>
                This is the start of <strong>#{channel}</strong>.{' '}
                {space.peers.size ? 'Say hello.' : 'Messages from before you joined arrive when another member is online.'}
              </p>
            </div>
          )}
          {messages.map((m: ChatMessage, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || day(prev.ts) !== day(m.ts);
            const grouped = !newDay && prev && prev.uid === m.uid && m.ts - prev.ts < 5 * 60_000;
            const mine = m.uid === space.uid;
            const mention = !mine && space.mentionsMe(m);
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <div className="chat-day" role="separator">
                    <span>{day(m.ts)}</span>
                  </div>
                )}
                <article className={`chat-msg${grouped ? ' chat-msg--grouped' : ''}${mention ? ' chat-msg--mention' : ''}`}>
                  {!grouped && (
                    <span className="chat-avatar" style={{ background: hue(m.nick) }} aria-hidden="true">
                      {m.nick.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="chat-msg__body">
                    {!grouped && (
                      <header>
                        <strong>{m.nick}</strong>
                        <time dateTime={new Date(m.ts).toISOString()}>{time(m.ts)}</time>
                      </header>
                    )}
                    <p>{renderText(m.text, space.nick)}</p>
                  </div>
                </article>
              </Fragment>
            );
          })}
        </div>
        <div className="chat-typing" aria-live="polite">
          {typing.length > 0 && `${typing.map((p) => p.nick).join(', ')} ${typing.length === 1 ? 'is' : 'are'} typing…`}
        </div>
        <form
          className="chat-compose"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <DictateField label="message" onText={(spoken) => setDraft((v) => appendSpoken(v, spoken))}>
            <textarea
              aria-label={`Message #${channel}`}
              placeholder={`Message #${channel}`}
              value={draft}
              rows={1}
              maxLength={4000}
              onChange={(e) => {
                setDraft(e.target.value);
                const last = lastTyping.current;
                if (last.ch !== channel || Date.now() - last.at > 2500) {
                  lastTyping.current = { ch: channel, at: Date.now() };
                  space.typing(channel);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
            />
          </DictateField>
          <button type="submit" className="btn btn-primary btn-icon" aria-label="Send" disabled={!draft.trim()}>
            <Send size={16} />
          </button>
        </form>
      </section>

      <aside className="chat-people" aria-label="People in this channel">
        <h3>In #{channel}</h3>
        <ul>
          {joinedHere && (
            <li>
              <span className="chat-avatar chat-avatar--sm" style={{ background: hue(space.nick) }}>
                {space.nick.slice(0, 1).toUpperCase()}
              </span>
              {space.nick} (you)
            </li>
          )}
          {here.map((p) => (
            <li key={p.uid}>
              <span className="chat-avatar chat-avatar--sm" style={{ background: hue(p.nick) }}>
                {p.nick.slice(0, 1).toUpperCase()}
              </span>
              {p.nick}
            </li>
          ))}
        </ul>
        {space.peers.size > here.length && (
          <p className="tool-muted">
            {space.peers.size - here.length} more online in other channels.
          </p>
        )}
      </aside>

      {browsing && (
        <div className="chat-browser-wrap" onClick={(e) => e.target === e.currentTarget && setBrowsing(false)}>
          <ChannelBrowser
            space={space}
            onClose={() => setBrowsing(false)}
            onOpen={(ch) => {
              onChannel(ch);
              setBrowsing(false);
              setDrawer(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function ChatPage(props: ToolProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const urlSpace = params.get('space') || '';
  const urlChannel = cleanChannel(params.get('ch') || '') || GENERAL;
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [version, setVersion] = useState(0);
  const { spaces, active } = useMemo(() => savedSpaces(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const known = spaces.map((s) => s.name);
  const invited = urlSpace && validSpace.test(urlSpace) && !known.includes(urlSpace) ? urlSpace : '';
  const current = urlSpace && known.includes(urlSpace) ? urlSpace : invited ? '' : active;
  const space = useMemo(() => (current ? getSpace(current) : null), [current]);

  const go = (name: string, ch = GENERAL) => {
    if (name) setActiveSpace(name);
    setVersion((v) => v + 1);
    navigate(name ? `/chat?space=${encodeURIComponent(name)}&ch=${encodeURIComponent(ch)}` : '/chat', { replace: true });
  };

  const showSetup = adding || !space;
  return (
    <ToolShell
      {...props}
      name="NinjaChat"
      subtitle="Public channels for your group, peer to peer. No accounts, no servers keeping your messages."
      status={space?.status === 'live' ? 'Online' : 'Saved locally'}
      compact={!showSetup}
    >
      {message && (
        <div className="tool-alert" role="status">
          {message}
          <button type="button" className="btn btn-secondary btn-icon" aria-label="Dismiss" onClick={() => setMessage('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {showSetup ? (
        <Setup
          invited={adding ? '' : invited}
          onCancel={adding && space ? () => setAdding(false) : undefined}
          onDone={(name) => {
            setAdding(false);
            go(name);
          }}
        />
      ) : (
        <Room
          key={space.name}
          space={space}
          spaces={known}
          channel={urlChannel}
          onChannel={(ch) => go(space.name, ch)}
          onSpace={(name) => go(name)}
          onAddSpace={() => setAdding(true)}
          onMessage={setMessage}
        />
      )}
    </ToolShell>
  );
}
