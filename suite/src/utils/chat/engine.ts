/**
 * NinjaChat: IRC-style public channels, peer to peer.
 *
 * A "space" is one VDO.Ninja room (NinjaOffice salt) that everyone with its
 * name can join. Inside it, channels are public: anyone can create, join or
 * leave any of them, and #general always exists. Every message is stored on
 * each member's device; when someone connects, the peers swap whatever the
 * other is missing, so history survives as long as somebody kept it. Each
 * member passes messages on (deduplicated), so the mesh still delivers when two
 * people have no direct connection.
 */
import { openDB } from 'idb';
import { LiveSession } from '../live/session';

export interface ChatMessage {
  id: string;
  ch: string;
  uid: string;
  nick: string;
  text: string;
  ts: number;
}
export interface ChatChannel {
  name: string;
  ts: number;
  by: string;
  topic?: string;
}
export interface SpacePrefs {
  name: string;
  bell: boolean;
  joined: string[];
  lastRead: Record<string, number>;
  active?: string;
}
export interface ChatPeer {
  /** The connection this was last heard through (may be someone relaying). */
  uuid: string;
  seen: number;
  nick: string;
  uid: string;
  color: string;
  joined: string[];
  typing?: { ch: string; until: number };
}

export const GENERAL = 'general';
const PREFS_KEY = 'officeninja_chat';
const UID_KEY = 'officeninja_chat_uid';
const NAME_KEY = 'officeninja_meet_name';
const PER_CHANNEL = 1000;
const MAX_TEXT = 4000;

export const validSpace = /^[a-zA-Z0-9_-]{3,64}$/;
export const cleanChannel = (name: string) =>
  name
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

const rand = (n: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    /* private mode: settings last for this visit */
  }
}

export function myUid() {
  let uid = readLS<string>(UID_KEY, '');
  if (typeof uid !== 'string' || !/^[a-z0-9]{12}$/.test(uid)) {
    uid = rand(12);
    writeLS(UID_KEY, JSON.stringify(uid));
  }
  return uid;
}
export function myNick() {
  try {
    return (localStorage.getItem(NAME_KEY) || '').trim().slice(0, 32);
  } catch {
    return '';
  }
}
export function setMyNick(nick: string) {
  writeLS(NAME_KEY, nick.trim().slice(0, 32));
}

/* ---------------- saved spaces ---------------- */

export function savedSpaces(): { spaces: SpacePrefs[]; active: string } {
  const prefs = readLS<{ spaces?: SpacePrefs[]; active?: string }>(PREFS_KEY, {});
  const spaces = (prefs.spaces ?? []).filter((s) => s && validSpace.test(s.name));
  return { spaces, active: prefs.active && spaces.some((s) => s.name === prefs.active) ? prefs.active : spaces[0]?.name ?? '' };
}
function saveSpaces(spaces: SpacePrefs[], active: string) {
  writeLS(PREFS_KEY, { spaces, active });
}
export function rememberSpace(name: string) {
  const { spaces } = savedSpaces();
  if (!spaces.some((s) => s.name === name)) spaces.push({ name, bell: false, joined: [GENERAL], lastRead: {} });
  saveSpaces(spaces, name);
}
export function forgetSpace(name: string) {
  const { spaces, active } = savedSpaces();
  const rest = spaces.filter((s) => s.name !== name);
  saveSpaces(rest, active === name ? rest[0]?.name ?? '' : active);
  closeSpace(name);
}
export function setActiveSpace(name: string) {
  const { spaces } = savedSpaces();
  saveSpaces(spaces, name);
}
function updatePrefs(name: string, change: (p: SpacePrefs) => void) {
  const { spaces, active } = savedSpaces();
  const p = spaces.find((s) => s.name === name);
  if (!p) return;
  change(p);
  saveSpaces(spaces, active);
}

/* ---------------- history on this device ---------------- */

async function db() {
  return openDB('officeninja-chat', 1, {
    upgrade(d) {
      d.createObjectStore('spaces', { keyPath: 'name' });
    },
  });
}

/* ---------------- one space ---------------- */

export class ChatSpace extends EventTarget {
  readonly name: string;
  readonly uid = myUid();
  nick: string;
  status: 'loading' | 'connecting' | 'live' | 'error' | 'closed' = 'loading';
  error = '';
  channels = new Map<string, ChatChannel>();
  messages = new Map<string, ChatMessage[]>();
  peers = new Map<string, ChatPeer>();
  private ids = new Set<string>();
  private session: LiveSession | null = null;
  private saveTimer = 0;
  private beat = 0;
  private loaded: Promise<void>;

  constructor(name: string) {
    super();
    this.name = name;
    this.nick = myNick() || `guest-${this.uid.slice(0, 4)}`;
    this.channels.set(GENERAL, { name: GENERAL, ts: 0, by: '' });
    this.loaded = this.load();
  }

  get prefs(): SpacePrefs {
    return savedSpaces().spaces.find((s) => s.name === this.name) ?? { name: this.name, bell: false, joined: [GENERAL], lastRead: {} };
  }

  private changed() {
    this.dispatchEvent(new Event('change'));
  }

  private async load() {
    try {
      const d = await db();
      const rec = (await d.get('spaces', this.name)) as { messages?: ChatMessage[]; channels?: ChatChannel[] } | undefined;
      d.close();
      for (const c of rec?.channels ?? []) this.addChannel(c, false);
      for (const m of rec?.messages ?? []) this.addMessage(m, false);
    } catch {
      /* history unavailable; live messages still work */
    }
    this.status = 'connecting';
    this.changed();
  }

  private persist() {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => {
      try {
        const d = await db();
        await d.put('spaces', {
          name: this.name,
          channels: [...this.channels.values()],
          messages: [...this.messages.values()].flat(),
        });
        d.close();
      } catch {
        /* try again on the next message */
      }
    }, 800);
  }

  async connect() {
    await this.loaded;
    if (this.status === 'closed' || this.session) return;
    const room = `chat_${this.name.replace(/-/g, '_')}`.slice(0, 60);
    const session = new LiveSession({ room, pass: `chat-${this.name}`, key: '' }, this.nick, [], { relay: true });
    this.session = session;
    session.addEventListener('peer-open', (e) => {
      const uuid = (e as CustomEvent<string>).detail;
      void session.send('here', this.presence(), uuid);
      void session.send('since', this.since(), uuid);
    });
    session.addEventListener('peer-left', (e) => {
      const uuid = (e as CustomEvent<string>).detail;
      for (const [uid, peer] of this.peers) if (peer.uuid === uuid) this.peers.delete(uid);
      this.changed();
    });
    // Say who is here every 30 s; forget anyone not heard from in 75 s.
    this.beat = window.setInterval(() => {
      void session.send('here', this.presence());
      const stale = Date.now() - 75_000;
      let dirty = false;
      for (const [uid, peer] of this.peers)
        if (peer.seen < stale) {
          this.peers.delete(uid);
          dirty = true;
        }
      if (dirty) this.changed();
    }, 30_000);
    session.addEventListener('status', () => {
      this.status = session.status === 'live' ? 'live' : session.status === 'error' ? 'error' : this.status === 'closed' ? 'closed' : 'connecting';
      this.error = session.error;
      this.changed();
    });
    session.addEventListener('message', (e) => this.receive((e as CustomEvent<{ type: string; payload: unknown; from: string }>).detail));
    await session.connect();
  }

  private presence() {
    return { nick: this.nick, uid: this.uid, joined: this.prefs.joined };
  }

  /** The newest message time per channel, so a peer can send what is newer. */
  private since() {
    const out: Record<string, number> = {};
    for (const [ch, list] of this.messages) out[ch] = list.length ? list[list.length - 1].ts : 0;
    return { have: out, channels: [...this.channels.keys()] };
  }

  private receive({ type, payload, from }: { type: string; payload: unknown; from: string }) {
    const p = payload as Record<string, unknown>;
    if (type === 'msg') {
      const m = this.validMessage(p?.m);
      if (m && this.addMessage(m, true)) this.onIncoming(m);
    } else if (type === 'chan') {
      const c = p?.c as ChatChannel;
      if (c && typeof c.name === 'string') this.addChannel(c, true);
    } else if (type === 'here') {
      const uid = String(p?.uid || '').slice(0, 16);
      if (!uid || uid === this.uid) return;
      const direct = this.session?.peers.get(from);
      const before = this.peers.get(uid);
      this.peers.set(uid, {
        uuid: from,
        seen: Date.now(),
        nick: String(p?.nick || 'guest').slice(0, 32),
        uid,
        color: before?.color || direct?.color || '#64748b',
        joined: Array.isArray(p?.joined) ? (p.joined as unknown[]).map((c) => cleanChannel(String(c))).filter(Boolean).slice(0, 200) : [],
        typing: before?.typing,
      });
      this.changed();
    } else if (type === 'typing') {
      const peer = this.peers.get(String(p?.uid || ''));
      if (peer && typeof p?.ch === 'string') {
        const typing = { ch: p.ch, until: Date.now() + 4000 };
        peer.typing = typing;
        this.changed();
        window.setTimeout(() => {
          if (peer.typing === typing) {
            peer.typing = undefined;
            this.changed();
          }
        }, 4000);
      }
    } else if (type === 'since') {
      // Send the asker what they lack: newer messages and channels they don't know.
      const have = (p?.have ?? {}) as Record<string, number>;
      const theirChannels = new Set(Array.isArray(p?.channels) ? (p.channels as string[]) : []);
      const msgs: ChatMessage[] = [];
      for (const [ch, list] of this.messages) {
        const after = (Number(have[ch]) || 0) - 60_000; // a minute of overlap covers clock skew
        msgs.push(...list.filter((m) => m.ts > after).slice(-300));
      }
      const chans = [...this.channels.values()].filter((c) => !theirChannels.has(c.name));
      if (msgs.length || chans.length) void this.session?.send('hist', { msgs, chans }, from);
    } else if (type === 'hist') {
      for (const c of (Array.isArray(p?.chans) ? p.chans : []) as ChatChannel[]) if (c && typeof c.name === 'string') this.addChannel(c, false);
      let added = 0;
      for (const raw of (Array.isArray(p?.msgs) ? p.msgs : []) as unknown[]) {
        const m = this.validMessage(raw);
        if (m && this.addMessage(m, false)) added++;
      }
      if (added) this.persist();
      this.changed();
    }
  }

  private validMessage(raw: unknown): ChatMessage | null {
    const m = raw as ChatMessage;
    if (!m || typeof m.id !== 'string' || typeof m.text !== 'string' || typeof m.ch !== 'string') return null;
    const ch = cleanChannel(m.ch);
    if (!ch || !m.text.trim()) return null;
    return {
      id: m.id.slice(0, 32),
      ch,
      uid: String(m.uid || '').slice(0, 16),
      nick: String(m.nick || 'guest').slice(0, 32),
      text: m.text.slice(0, MAX_TEXT),
      // Nobody gets to sort themselves into the future.
      ts: Math.min(Number(m.ts) || Date.now(), Date.now() + 5 * 60_000),
    };
  }

  private addChannel(c: ChatChannel, announce: boolean) {
    const name = cleanChannel(c.name);
    if (!name || this.channels.has(name)) return false;
    this.channels.set(name, { name, ts: Number(c.ts) || Date.now(), by: String(c.by || '').slice(0, 32), topic: c.topic ? String(c.topic).slice(0, 200) : undefined });
    if (announce) {
      this.persist();
      this.changed();
    }
    return true;
  }

  private addMessage(m: ChatMessage, live: boolean) {
    if (this.ids.has(m.id)) return false;
    this.ids.add(m.id);
    if (!this.channels.has(m.ch)) this.channels.set(m.ch, { name: m.ch, ts: m.ts, by: m.nick });
    const list = this.messages.get(m.ch) ?? [];
    // Usually the newest: append; otherwise insert in time order.
    if (!list.length || list[list.length - 1].ts <= m.ts) list.push(m);
    else list.splice(list.findIndex((x) => x.ts > m.ts), 0, m);
    if (list.length > PER_CHANNEL) list.splice(0, list.length - PER_CHANNEL);
    this.messages.set(m.ch, list);
    if (live) {
      this.persist();
      this.changed();
    }
    return true;
  }

  private onIncoming(m: ChatMessage) {
    if (m.uid === this.uid) return;
    this.dispatchEvent(new CustomEvent('incoming', { detail: m }));
  }

  /* ---------------- actions ---------------- */

  post(ch: string, text: string) {
    const body = text.trim().slice(0, MAX_TEXT);
    if (!body) return;
    const m: ChatMessage = { id: rand(14), ch, uid: this.uid, nick: this.nick, text: body, ts: Date.now() };
    this.addMessage(m, true);
    this.markRead(ch);
    void this.session?.send('msg', { m });
  }

  createChannel(raw: string, topic = '') {
    const name = cleanChannel(raw);
    if (!name) return '';
    const c: ChatChannel = { name, ts: Date.now(), by: this.nick, topic: topic.trim() || undefined };
    if (this.addChannel(c, true)) void this.session?.send('chan', { c });
    this.join(name);
    return name;
  }

  join(ch: string) {
    updatePrefs(this.name, (p) => {
      if (!p.joined.includes(ch)) p.joined.push(ch);
    });
    void this.session?.send('here', this.presence());
    this.changed();
  }

  leave(ch: string) {
    if (ch === GENERAL) return;
    updatePrefs(this.name, (p) => {
      p.joined = p.joined.filter((c) => c !== ch);
    });
    void this.session?.send('here', this.presence());
    this.changed();
  }

  markRead(ch: string) {
    const list = this.messages.get(ch);
    if (!list?.length) return;
    const last = list[list.length - 1].ts;
    if ((this.prefs.lastRead[ch] ?? 0) >= last) return;
    updatePrefs(this.name, (p) => {
      p.lastRead[ch] = last;
    });
    this.changed();
  }

  setBell(on: boolean) {
    updatePrefs(this.name, (p) => {
      p.bell = on;
    });
    this.changed();
  }

  typing(ch: string) {
    void this.session?.send('typing', { ch, uid: this.uid });
  }

  rename(nick: string) {
    const clean = nick.trim().slice(0, 32);
    if (!clean) return;
    this.nick = clean;
    setMyNick(clean);
    void this.session?.send('here', this.presence());
    this.changed();
  }

  unread(ch: string) {
    const after = this.prefs.lastRead[ch] ?? 0;
    return (this.messages.get(ch) ?? []).filter((m) => m.ts > after && m.uid !== this.uid).length;
  }

  mentionsMe(m: ChatMessage) {
    return new RegExp(`(^|\\W)@${this.nick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(m.text);
  }

  close() {
    this.status = 'closed';
    window.clearInterval(this.beat);
    this.session?.close();
    this.session = null;
    this.changed();
  }
}

/* ---------------- the open spaces, shared across pages ---------------- */

const open = new Map<string, ChatSpace>();

export function getSpace(name: string) {
  let space = open.get(name);
  if (!space) {
    space = new ChatSpace(name);
    open.set(name, space);
    space.addEventListener('incoming', (e) => notify(space!, (e as CustomEvent<ChatMessage>).detail));
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__chat = space;
    void space.connect();
  }
  return space;
}

export function closeSpace(name: string) {
  open.get(name)?.close();
  open.delete(name);
}

/** Where the chat page is looking now, so it does not notify about what you can see. */
let viewing: { space: string; ch: string } | null = null;
export function setViewing(v: { space: string; ch: string } | null) {
  viewing = v;
}

function notify(space: ChatSpace, m: ChatMessage) {
  const prefs = space.prefs;
  if (!prefs.bell) return;
  const mention = space.mentionsMe(m);
  if (!mention && !prefs.joined.includes(m.ch)) return;
  if (!document.hidden && viewing?.space === space.name && viewing.ch === m.ch) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(`${m.nick} in #${m.ch}${mention ? ' (mentioned you)' : ''}`, {
      body: m.text.slice(0, 180),
      tag: `chat-${space.name}-${m.ch}`,
    });
    n.onclick = () => {
      window.focus();
      location.hash = `#/chat?space=${encodeURIComponent(space.name)}&ch=${encodeURIComponent(m.ch)}`;
      n.close();
    };
  } catch {
    /* some browsers only notify from a service worker */
  }
}

/** Keep spaces with the bell on connected while NinjaOffice is open. */
export function startChatNotifications() {
  for (const s of savedSpaces().spaces) if (s.bell) getSpace(s.name);
}
