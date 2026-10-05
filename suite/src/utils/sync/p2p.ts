/**
 * Device-to-device sync over VDO.Ninja. Devices that share a sync link join the
 * same private VDO.Ninja room and talk over encrypted WebRTC data channels: no
 * account, no API key and no server of ours. Data never sits on a server; it
 * flows only while at least two devices have OfficeNinja open.
 *
 * One tab per browser holds the connection (a Web Lock); other tabs wait and
 * take over if it closes. Every device sends a manifest (what it has, with
 * content hashes); each side then fetches only what it is missing or what is
 * newer, and merges it with the same rules as a backup restore.
 */
import {
  applyDeletions,
  applyItem,
  buildManifest,
  decodeJson,
  describeReport,
  deviceInfo,
  emptyReport,
  encodeJson,
  loadItem,
  wanted,
} from './snapshot';
import type { Manifest, SyncItem } from './snapshot';
import { subscribeToTools } from '../toolStorage';

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@vdoninja/sdk@1.6.1/vdoninja-sdk.min.js';
const CONFIG_KEY = 'officeninja_sync_group';
const CHUNK = 48_000;
const PROTOCOL = 'officeninja-sync';

export interface SyncGroup {
  room: string;
  password: string;
  created: number;
}
export interface PeerInfo {
  uuid: string;
  name: string;
  lastSeen: number;
}
export type SyncState = 'off' | 'waiting' | 'connecting' | 'live' | 'error' | 'unsupported';
export interface SyncStatus {
  state: SyncState;
  peers: PeerInfo[];
  lastSync: number | null;
  lastResult: string;
  error: string;
  /** False when another tab of this browser holds the connection. */
  leader: boolean;
}

type Sdk = {
  addEventListener(type: string, fn: (e: CustomEvent) => void): void;
  connect(): Promise<void>;
  joinRoom(o: { room: string; password?: string | false }): Promise<void>;
  announce(o: { streamID: string }): Promise<void>;
  view(streamID: string, o: { audio: boolean; video: boolean }): void;
  sendData(data: unknown, target?: { uuid: string }): boolean;
  disconnect(): void;
};

/* ---------------- group config ---------------- */

const randomId = (n: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) =>
    'abcdefghijkmnpqrstuvwxyz23456789'[b % 32],
  ).join('');

export function syncGroup(): SyncGroup | null {
  try {
    const g = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    return g?.room && g?.password ? g : null;
  } catch {
    return null;
  }
}
function saveGroup(g: SyncGroup | null) {
  try {
    if (g) localStorage.setItem(CONFIG_KEY, JSON.stringify(g));
    else localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* ignore */
  }
}
export function createGroup(): SyncGroup {
  const g = { room: `onsync_${randomId(20)}`, password: randomId(24), created: Date.now() };
  saveGroup(g);
  return g;
}
/** The secret part of a pairing link: `room~password`. */
export const pairingCode = (g: SyncGroup) => `${g.room}~${g.password}`;
export function parsePairingCode(code: string): SyncGroup | null {
  const m = code.trim().match(/(onsync_[a-z0-9]{8,40})~([a-z0-9]{12,64})/i);
  return m ? { room: m[1], password: m[2], created: Date.now() } : null;
}
export function pairingLink(g: SyncGroup) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/sync?pair=${encodeURIComponent(pairingCode(g))}`;
}
export function joinGroup(g: SyncGroup) {
  saveGroup(g);
}
export function leaveGroup() {
  saveGroup(null);
}

/* ---------------- status ---------------- */

let status: SyncStatus = {
  state: 'off',
  peers: [],
  lastSync: null,
  lastResult: '',
  error: '',
  leader: false,
};
const listeners = new Set<(s: SyncStatus) => void>();
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  for (const l of listeners) l(status);
}
export function getSyncStatus() {
  return status;
}
export function onSyncStatus(fn: (s: SyncStatus) => void) {
  listeners.add(fn);
  fn(status);
  return () => {
    listeners.delete(fn);
  };
}

/* ---------------- connection ---------------- */

let sdk: Sdk | null = null;
let stopLock: (() => void) | null = null;
let starting = false;
const peers = new Map<string, PeerInfo>();
const incoming = new Map<string, { n: number; parts: string[]; got: number }>();
let changeTimer: number | undefined;
let pollTimer: number | undefined;
let unsubscribe: (() => void)[] = [];

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the VDO.Ninja SDK. Check your connection.'));
    document.head.appendChild(s);
  });
}

function send(obj: Record<string, unknown>, uuid?: string) {
  try {
    return sdk?.sendData({ app: PROTOCOL, v: 1, ...obj }, uuid ? { uuid } : undefined) ?? false;
  } catch {
    return false;
  }
}

async function sendManifest(uuid?: string) {
  const manifest = await buildManifest();
  send({ type: 'manifest', device: deviceInfo(), manifest }, uuid);
}

async function sendItem(key: string, uuid: string) {
  const item = await loadItem(key);
  if (!item) return;
  const text = encodeJson(item);
  const x = randomId(10);
  const n = Math.max(1, Math.ceil(text.length / CHUNK));
  for (let i = 0; i < n; i++) {
    send({ type: 'part', x, i, n, d: text.slice(i * CHUNK, (i + 1) * CHUNK) }, uuid);
    // Give the data channel room to drain on big files.
    if (i % 12 === 11) await new Promise((r) => setTimeout(r, 25));
  }
}

const pendingApply: SyncItem[] = [];
let applying = false;
async function drainApply() {
  if (applying) return;
  applying = true;
  const report = emptyReport();
  try {
    while (pendingApply.length) await applyItem(pendingApply.shift()!, report);
  } finally {
    applying = false;
  }
  const changed = report.added + report.updated + report.merged + report.deleted;
  setStatus({ lastSync: Date.now(), lastResult: describeReport(report) });
  if (changed) scheduleManifest(1500);
}

async function onData(data: unknown, uuid: string) {
  const msg = data as { app?: string; type?: string; [k: string]: unknown };
  if (!msg || msg.app !== PROTOCOL) return;
  if (msg.type === 'manifest') {
    const device = msg.device as { id?: string; name?: string } | undefined;
    peers.set(uuid, { uuid, name: String(device?.name || 'Device'), lastSeen: Date.now() });
    setStatus({ peers: [...peers.values()] });
    const remote = msg.manifest as Manifest;
    if (!remote || !Array.isArray(remote.entries)) return;
    const report = emptyReport();
    await applyDeletions(remote.deletedDocs ?? {}, report);
    const keys = wanted(await buildManifest(), remote);
    if (keys.length) send({ type: 'get', keys }, uuid);
    else setStatus({ lastSync: Date.now(), lastResult: report.deleted ? describeReport(report) : 'Up to date' });
  } else if (msg.type === 'get' && Array.isArray(msg.keys)) {
    for (const key of msg.keys.slice(0, 500)) if (typeof key === 'string') await sendItem(key, uuid);
  } else if (msg.type === 'part' && typeof msg.x === 'string') {
    const n = Number(msg.n);
    const i = Number(msg.i);
    if (!(n > 0 && n < 100_000 && i >= 0 && i < n)) return;
    const id = `${uuid}:${msg.x}`;
    const slot = incoming.get(id) ?? { n, parts: new Array<string>(n), got: 0 };
    if (slot.parts[i] === undefined) {
      slot.parts[i] = String(msg.d ?? '');
      slot.got++;
    }
    incoming.set(id, slot);
    if (slot.got === slot.n) {
      incoming.delete(id);
      try {
        pendingApply.push(decodeJson<SyncItem>(slot.parts.join('')));
        void drainApply();
      } catch {
        /* a damaged transfer is simply skipped; the next manifest retries it */
      }
    }
  }
}

function scheduleManifest(delay = 2500) {
  window.clearTimeout(changeTimer);
  changeTimer = window.setTimeout(() => {
    if (sdk && peers.size) void sendManifest();
  }, delay);
}

async function connect(group: SyncGroup) {
  if (typeof RTCPeerConnection === 'undefined') {
    setStatus({ state: 'unsupported', error: 'This browser cannot open peer-to-peer connections.' });
    return;
  }
  setStatus({ state: 'connecting', error: '' });
  if (!(window as unknown as { VDONinjaSDK?: unknown }).VDONinjaSDK) await loadScript(SDK_URL);
  const Ctor = (window as unknown as { VDONinjaSDK: new (o: object) => Sdk }).VDONinjaSDK;
  const me = deviceInfo();
  const streamID = `ons${me.id}`.replace(/[^A-Za-z0-9_]/g, '').slice(0, 40);
  const client = new Ctor({ host: 'wss://wss.vdo.ninja', salt: 'vdo.ninja', debug: false });
  sdk = client;
  client.addEventListener('dataChannelOpen', (e) => {
    const uuid = e.detail?.uuid;
    if (uuid) {
      peers.set(uuid, { uuid, name: 'Device', lastSeen: Date.now() });
      setStatus({ peers: [...peers.values()] });
      void sendManifest(uuid);
    }
  });
  client.addEventListener('dataReceived', (e) => void onData(e.detail?.data, e.detail?.uuid));
  client.addEventListener('peerDisconnected', (e) => {
    peers.delete(e.detail?.uuid);
    setStatus({ peers: [...peers.values()] });
  });
  client.addEventListener('listing', (e) => {
    for (const entry of e.detail?.list || [])
      if (entry.streamID && entry.streamID !== streamID) {
        try {
          client.view(entry.streamID, { audio: false, video: false });
        } catch {
          /* a peer that left between listing and view */
        }
      }
  });
  client.addEventListener('disconnected', () => {
    if (sdk === client) setStatus({ state: 'connecting' });
  });
  client.addEventListener('reconnected', () => {
    if (sdk === client) setStatus({ state: 'live' });
  });
  await client.connect();
  await client.joinRoom({ room: group.room, password: group.password });
  await client.announce({ streamID });
  setStatus({ state: 'live' });

  // Local edits (any tab) trigger a fresh manifest to the other devices.
  const onChange = () => scheduleManifest();
  unsubscribe.push(subscribeToTools(onChange));
  try {
    const docs = new BroadcastChannel('officeninja_documents');
    docs.onmessage = onChange;
    unsubscribe.push(() => docs.close());
  } catch {
    /* polling below covers it */
  }
  pollTimer = window.setInterval(() => scheduleManifest(0), 45_000);
}

/** Start syncing (if this device is in a group). Safe to call repeatedly. */
export async function startSync() {
  const group = syncGroup();
  if (!group || sdk || starting) return;
  starting = true;
  setStatus({ state: 'waiting', leader: false });
  const begin = async () => {
    setStatus({ leader: true });
    try {
      await connect(group);
    } catch (error) {
      setStatus({ state: 'error', error: error instanceof Error ? error.message : 'Could not connect.' });
      teardown();
    }
  };
  try {
    if ('locks' in navigator) {
      // Hold the lock until stopSync(); other tabs queue behind it.
      void navigator.locks.request('officeninja-sync-p2p', () =>
        new Promise<void>((release) => {
          stopLock = release;
          void begin();
        }),
      );
    } else await begin();
  } finally {
    starting = false;
  }
}

function teardown() {
  window.clearTimeout(changeTimer);
  window.clearInterval(pollTimer);
  for (const u of unsubscribe) u();
  unsubscribe = [];
  try {
    sdk?.disconnect();
  } catch {
    /* ignore */
  }
  sdk = null;
  peers.clear();
  incoming.clear();
}

export function stopSync() {
  teardown();
  stopLock?.();
  stopLock = null;
  setStatus({ state: 'off', peers: [], leader: false });
}

/** Ask every connected device to compare again now. */
export function syncNow() {
  if (sdk && peers.size) void sendManifest();
}
