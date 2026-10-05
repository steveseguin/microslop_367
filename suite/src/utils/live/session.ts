/**
 * A live editing session for one file, over a private VDO.Ninja room.
 *
 * Share links look like `#/<app>?live=<room>~<password>[~<editKey>]`. The edit
 * key never travels except inside edit links: every change is signed with it
 * (HMAC-SHA-256), so a view-only link cannot forge changes even from a
 * modified client. Messages are chunked so large documents fit through the
 * data channel.
 */
import { decodeJson, encodeJson } from '../sync/snapshot';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@vdoninja/sdk@1.6.1/vdoninja-sdk.min.js';
const CHUNK = 48_000;

type Sdk = {
  addEventListener(type: string, fn: (e: CustomEvent) => void): void;
  connect(): Promise<void>;
  joinRoom(o: { room: string; password?: string | false }): Promise<void>;
  announce(o: { streamID: string }): Promise<void>;
  view(streamID: string, o: { audio: boolean; video: boolean }): void;
  sendData(data: unknown, target?: { uuid: string }): boolean;
  disconnect(): void;
};

export interface LiveInfo {
  room: string;
  pass: string;
  /** Present for editors only. */
  key: string;
}
export interface LivePeer {
  uuid: string;
  name: string;
  color: string;
  mode: 'edit' | 'view';
}
export interface LiveMessage {
  type: string;
  payload: unknown;
  from: string;
}

const rand = (n: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) =>
    'abcdefghijkmnpqrstuvwxyz23456789'[b % 32],
  ).join('');

export const PEER_COLORS = ['#e5484d', '#f76b15', '#30a46c', '#0090ff', '#8e4ec6', '#d6409f', '#12a594'];

export function newLiveInfo(prefix: string): LiveInfo {
  return { room: `${prefix}_${rand(18)}`, pass: rand(20), key: rand(24) };
}

/** Parse `room~pass[~key]` (also accepts it URL-encoded). */
export function parseLive(raw: string | null): LiveInfo | null {
  if (!raw) return null;
  const [room, pass, key] = decodeURIComponent(raw).split('~');
  if (!/^[a-z]{2,6}_[a-z0-9]{8,40}$/.test(room || '') || !/^[a-z0-9]{8,64}$/.test(pass || '')) return null;
  return { room, pass, key: /^[a-z0-9]{8,64}$/.test(key || '') ? key : '' };
}

export function liveLink(route: string, info: LiveInfo, edit: boolean) {
  const code = [info.room, info.pass, edit ? info.key : ''].filter(Boolean).join('~');
  return `${location.origin}${location.pathname}#${route}?live=${code}`;
}

const scripts = new Map<string, Promise<void>>();
function loadScript(src: string) {
  // One load per page, even when two sessions start at once.
  let p = scripts.get(src);
  if (!p) {
    p = loadScriptOnce(src);
    p.catch(() => scripts.delete(src));
    scripts.set(src, p);
  }
  return p;
}

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the VDO.Ninja SDK. Check your connection.'));
    document.head.appendChild(s);
  });
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export class LiveSession extends EventTarget {
  readonly info: LiveInfo;
  readonly mode: 'edit' | 'view';
  readonly me: { id: string; name: string; color: string };
  status: 'connecting' | 'live' | 'error' | 'closed' = 'connecting';
  error = '';
  peers = new Map<string, LivePeer>();
  private sdk: Sdk | null = null;
  private hmac: CryptoKey | null = null;
  private chunks = new Map<string, { parts: string[]; got: number; sig: string }>();
  private signedTypes: Set<string>;
  /** The person sharing passes everyone's changes on, so two guests without a
   *  direct connection still see each other's work. */
  readonly relay: boolean;
  private seen = new Set<string>();

  constructor(info: LiveInfo, name: string, signedTypes: string[], options: { relay?: boolean } = {}) {
    super();
    this.info = info;
    this.relay = !!options.relay;
    this.mode = info.key ? 'edit' : 'view';
    this.signedTypes = new Set(signedTypes);
    this.me = {
      id: rand(10),
      name: name.trim().slice(0, 32) || `Guest ${rand(3).toUpperCase()}`,
      color: PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)],
    };
  }

  private emit(type: string, detail?: unknown) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  async connect() {
    try {
      if (typeof RTCPeerConnection === 'undefined')
        throw new Error("This browser can't open peer-to-peer connections.");
      if (this.info.key)
        this.hmac = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(this.info.key),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign', 'verify'],
        );
      if (!(window as unknown as { VDONinjaSDK?: unknown }).VDONinjaSDK) await loadScript(SDK_URL);
      const Ctor = (window as unknown as { VDONinjaSDK: new (o: object) => Sdk }).VDONinjaSDK;
      const sdk = new Ctor({ host: 'wss://wss.vdo.ninja', salt: 'vdo.ninja', debug: false });
      this.sdk = sdk;
      const streamID = `lv${this.me.id}`;
      sdk.addEventListener('dataChannelOpen', (e) => {
        const uuid = e.detail?.uuid;
        if (!uuid) return;
        this.peers.set(uuid, this.peers.get(uuid) ?? { uuid, name: 'Guest', color: '#64748b', mode: 'view' });
        this.sendRaw({ t: 'hi', me: { ...this.me, mode: this.mode } }, uuid);
        this.emit('peers');
        this.emit('peer-open', uuid);
      });
      sdk.addEventListener('dataReceived', (e) => void this.receive(e.detail?.data, e.detail?.uuid));
      sdk.addEventListener('peerDisconnected', (e) => {
        this.peers.delete(e.detail?.uuid);
        this.emit('peers');
        this.emit('peer-left', e.detail?.uuid);
      });
      sdk.addEventListener('listing', (e) => {
        for (const entry of e.detail?.list || [])
          if (entry.streamID && entry.streamID !== streamID) {
            try {
              sdk.view(entry.streamID, { audio: false, video: false });
            } catch {
              /* gone already */
            }
          }
      });
      sdk.addEventListener('disconnected', () => {
        if (this.sdk === sdk && this.status !== 'closed') {
          this.status = 'connecting';
          this.emit('status');
        }
      });
      sdk.addEventListener('reconnected', () => {
        if (this.sdk === sdk) {
          this.status = 'live';
          this.emit('status');
        }
      });
      await sdk.connect();
      await sdk.joinRoom({ room: this.info.room, password: this.info.pass });
      await sdk.announce({ streamID });
      this.status = 'live';
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Could not connect.';
    }
    this.emit('status');
  }

  close() {
    this.status = 'closed';
    try {
      this.sdk?.disconnect();
    } catch {
      /* ignore */
    }
    this.sdk = null;
    this.peers.clear();
    this.emit('status');
    this.emit('peers');
  }

  private sendRaw(obj: unknown, uuid?: string) {
    try {
      this.sdk?.sendData(obj, uuid ? { uuid } : undefined);
    } catch {
      /* channel closing */
    }
  }

  /** Send a typed message to everyone (or one peer). Edits are signed. */
  async send(type: string, payload: unknown, to?: string) {
    if (!this.sdk || this.status !== 'live') return false;
    const signed = this.signedTypes.has(type);
    if (signed && this.mode === 'view') return false; // viewers never publish edits
    const mid = rand(12);
    this.markSeen(mid);
    const text = encodeJson({ type, payload, mid, b: to ? 0 : 1 });
    const sig =
      signed && this.hmac
        ? hex(await crypto.subtle.sign('HMAC', this.hmac, new TextEncoder().encode(text)))
        : '';
    return this.sendText(text, sig, to);
  }

  private markSeen(mid: string) {
    if (this.seen.size > 2000) this.seen.clear();
    this.seen.add(mid);
  }

  private async sendText(text: string, sig: string, to?: string) {
    if (text.length <= CHUNK) {
      this.sendRaw({ lv: 1, m: text, s: sig }, to);
      return true;
    }
    const id = rand(10);
    const n = Math.ceil(text.length / CHUNK);
    for (let i = 0; i < n; i++) {
      this.sendRaw({ lv: 1, c: { id, i, n, d: text.slice(i * CHUNK, (i + 1) * CHUNK) }, s: i === n - 1 ? sig : '' }, to);
      if (i % 12 === 11) await new Promise((r) => setTimeout(r, 20));
    }
    return true;
  }

  private async receive(data: unknown, uuid: string) {
    const d = data as { lv?: number; t?: string; me?: LivePeer; m?: string; s?: string; c?: { id: string; i: number; n: number; d: string } };
    if (!d || !uuid) return;
    if (d.t === 'hi' && d.me) {
      this.peers.set(uuid, {
        uuid,
        name: String(d.me.name || 'Guest').slice(0, 32),
        color: /^#[0-9a-f]{6}$/i.test(d.me.color) ? d.me.color : '#64748b',
        mode: d.me.mode === 'edit' ? 'edit' : 'view',
      });
      this.emit('peers');
      return;
    }
    if (d.lv !== 1) return;
    let text = d.m;
    let sig = d.s ?? '';
    if (d.c) {
      const c = d.c;
      if (!(c.n > 0 && c.n < 100_000 && c.i >= 0 && c.i < c.n)) return;
      const key = `${uuid}:${c.id}`;
      const slot = this.chunks.get(key) ?? { parts: new Array<string>(c.n), got: 0, sig: '' };
      if (slot.parts[c.i] === undefined) {
        slot.parts[c.i] = String(c.d ?? '');
        slot.got++;
      }
      if (d.s) slot.sig = d.s;
      this.chunks.set(key, slot);
      if (slot.got < c.n) return;
      this.chunks.delete(key);
      text = slot.parts.join('');
      sig = slot.sig;
    }
    if (typeof text !== 'string') return;
    let msg: { type: string; payload: unknown; mid?: string; b?: number };
    try {
      msg = decodeJson(text);
    } catch {
      return;
    }
    if (typeof msg.mid === 'string' && this.seen.has(msg.mid)) return;
    if (this.signedTypes.has(msg.type) && this.hmac) {
      const ok =
        /^[0-9a-f]+$/.test(sig) &&
        sig.length % 2 === 0 &&
        (await crypto.subtle.verify(
          'HMAC',
          this.hmac,
          new Uint8Array(sig.match(/../g)!.map((h) => parseInt(h, 16))),
          new TextEncoder().encode(text),
        ));
      if (!ok) {
        this.emit('rejected', uuid);
        return;
      }
    }
    if (typeof msg.mid === 'string') this.markSeen(msg.mid);
    if (this.relay && msg.b === 1 && msg.mid) {
      const body = text;
      for (const peer of this.peers.keys()) if (peer !== uuid) void this.sendText(body, sig, peer);
    }
    this.emit('message', { type: msg.type, payload: msg.payload, from: uuid } satisfies LiveMessage);
  }
}
