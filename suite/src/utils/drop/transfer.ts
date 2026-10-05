/**
 * NinjaDrop: send files straight from one browser to others over VDO.Ninja.
 *
 * The sender publishes a share under a name ("four-random-words" or their own).
 * Anyone opening the link sees the file list and pulls what they want. Each file
 * travels over several data channels at once (LANES), each with its own
 * backpressure, so one channel's buffer never stalls the transfer. Chunks carry
 * their index, so they can arrive on any lane in any order.
 *
 * Shares use NinjaOffice's own salt plus a password derived from the share name,
 * so a share name can never collide with a VDO.Ninja stream.
 */
import { ninjaClient } from '../ninja';

export const LANES = 4;
const CHUNK = 64 * 1024;
const READ_BLOCK = 2 * 1024 * 1024;
const HIGH_WATER = 4 * 1024 * 1024;
const LOW_WATER = 1024 * 1024;
/** Above this size, ask where to save first and write straight to disk. */
export const STREAM_TO_DISK_BYTES = 256 * 1024 * 1024;

type Sdk = {
  addEventListener(type: string, fn: (e: CustomEvent) => void): void;
  connect(): Promise<void>;
  announce(o: { streamID: string; label?: string }): Promise<void>;
  view(streamID: string, o: { audio: boolean; video: boolean; label?: string }): Promise<unknown>;
  sendData(data: unknown, target?: { uuid: string }): boolean;
  openChannel(uuid: string, label: string, o?: { ordered?: boolean; timeout?: number }): Promise<RTCDataChannel>;
  disconnect(): void;
};

export const validShareName = /^[a-zA-Z0-9_-]{1,64}$/;
export const streamIdFor = (name: string) => `dr_${name.replace(/-/g, '_')}`.slice(0, 64);
const passwordFor = (name: string) => `drop-${name}`;

const rand = (n: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');

export interface OfferedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface SharedFile extends OfferedFile {
  file: Blob;
  /** Finished sends of this file. */
  sent: number;
}

interface OutgoingTransfer {
  tid: string;
  uuid: string;
  file: SharedFile;
  bytes: number;
  cancelled: boolean;
  channels: RTCDataChannel[];
}

/* ---------------- helpers ---------------- */

function waitForDrain(channel: RTCDataChannel) {
  if (channel.bufferedAmount < HIGH_WATER) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const done = () => {
      channel.removeEventListener('bufferedamountlow', done);
      channel.removeEventListener('close', done);
      resolve();
    };
    channel.addEventListener('bufferedamountlow', done);
    channel.addEventListener('close', done);
  });
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const unit = Math.min(4, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** unit).toLocaleString(undefined, { maximumFractionDigits: unit ? 1 : 0 })} ${['B', 'KB', 'MB', 'GB', 'TB'][unit]}`;
}

/* ---------------- sending ---------------- */

export class DropSender extends EventTarget {
  readonly name: string;
  status: 'connecting' | 'live' | 'error' | 'closed' = 'connecting';
  error = '';
  files: SharedFile[] = [];
  /** Connected recipients. */
  peers = new Set<string>();
  transfers = new Map<string, OutgoingTransfer>();
  private sdk: Sdk | null = null;

  constructor(name: string) {
    super();
    this.name = name;
  }

  private changed() {
    this.dispatchEvent(new Event('change'));
  }

  async start() {
    try {
      const sdk = await ninjaClient<Sdk>({ password: passwordFor(this.name) });
      if (this.status === 'closed') return;
      this.sdk = sdk;
      sdk.addEventListener('dataChannelOpen', (e) => {
        const uuid = e.detail?.uuid;
        if (!uuid) return;
        this.peers.add(uuid);
        this.sendList(uuid);
        this.changed();
      });
      sdk.addEventListener('peerDisconnected', (e) => {
        const uuid = e.detail?.uuid;
        this.peers.delete(uuid);
        for (const t of this.transfers.values()) if (t.uuid === uuid) this.stopTransfer(t);
        this.changed();
      });
      sdk.addEventListener('dataReceived', (e) => void this.onData(e.detail?.data, e.detail?.uuid));
      const onAlert = (e: CustomEvent) => {
        const text = String(e.detail?.message || e.detail?.error || e.detail?.value || '');
        if (/already in use/i.test(text)) {
          this.status = 'error';
          this.error = 'That share name is already in use. Pick another name.';
          this.changed();
        }
      };
      sdk.addEventListener('alert', onAlert);
      sdk.addEventListener('error', onAlert);
      await sdk.connect();
      await sdk.announce({ streamID: streamIdFor(this.name), label: 'NinjaDrop' });
      if (this.status === 'connecting') this.status = 'live';
    } catch (error) {
      if (this.status === 'closed') return;
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Could not start sharing.';
    }
    this.changed();
  }

  add(blobs: { blob: Blob; name: string; type?: string }[]) {
    for (const { blob, name, type } of blobs) {
      this.files.push({ id: rand(10), name: name.slice(0, 240), size: blob.size, type: type || blob.type || '', file: blob, sent: 0 });
    }
    this.sendList();
    this.changed();
  }

  remove(id: string) {
    this.files = this.files.filter((f) => f.id !== id);
    for (const t of this.transfers.values()) if (t.file.id === id) this.stopTransfer(t);
    this.sendList();
    this.changed();
  }

  private send(msg: Record<string, unknown>, uuid?: string) {
    try {
      this.sdk?.sendData({ drop: 1, ...msg }, uuid ? { uuid } : undefined);
    } catch {
      /* the peer left */
    }
  }

  private sendList(uuid?: string) {
    const files: OfferedFile[] = this.files.map(({ id, name, size, type }) => ({ id, name, size, type }));
    if (uuid) this.send({ t: 'list', files }, uuid);
    else for (const peer of this.peers) this.send({ t: 'list', files }, peer);
  }

  private async onData(data: { drop?: number; t?: string; id?: string; tid?: string; lanes?: number }, uuid?: string) {
    if (!data || data.drop !== 1 || !uuid) return;
    if (data.t === 'hello') this.sendList(uuid);
    else if (data.t === 'get' && typeof data.id === 'string' && typeof data.tid === 'string') {
      const file = this.files.find((f) => f.id === data.id);
      if (!file) return this.send({ t: 'gone', tid: data.tid }, uuid);
      const lanes = Math.max(1, Math.min(8, Number(data.lanes) || LANES));
      void this.sendFile(file, uuid, data.tid.replace(/[^a-z0-9]/g, '').slice(0, 16), lanes);
    } else if (data.t === 'cancel' && typeof data.tid === 'string') {
      const t = this.transfers.get(data.tid);
      if (t) this.stopTransfer(t);
    }
  }

  private stopTransfer(t: OutgoingTransfer) {
    t.cancelled = true;
    t.channels.forEach((c) => c.close());
    this.transfers.delete(t.tid);
    this.changed();
  }

  private async sendFile(file: SharedFile, uuid: string, tid: string, lanes: number) {
    if (!this.sdk) return;
    const t: OutgoingTransfer = { tid, uuid, file, bytes: 0, cancelled: false, channels: [] };
    this.transfers.set(tid, t);
    this.changed();
    try {
      const sdk = this.sdk;
      t.channels = await Promise.all(
        Array.from({ length: lanes }, (_, k) => sdk.openChannel(uuid, `dp-${tid}-${k}`, { ordered: true, timeout: 20_000 })),
      );
      for (const c of t.channels) {
        c.binaryType = 'arraybuffer';
        c.bufferedAmountLowThreshold = LOW_WATER;
      }
      const total = Math.ceil(file.size / CHUNK);
      this.send({ t: 'start', tid, id: file.id, size: file.size, chunks: total, chunk: CHUNK, lanes }, uuid);

      // Read the file in big blocks (each read once, shared by the lanes), cut
      // them into chunks, and hand each chunk to whichever lane has room first.
      let next = 0;
      const blocks = new Map<number, Promise<Uint8Array>>();
      const chunkAt = async (index: number) => {
        const offset = index * CHUNK;
        const start = Math.floor(offset / READ_BLOCK) * READ_BLOCK;
        let block = blocks.get(start);
        if (!block) {
          block = file.file
            .slice(start, Math.min(file.size, start + READ_BLOCK))
            .arrayBuffer()
            .then((b) => new Uint8Array(b));
          blocks.set(start, block);
          // Keep only the current and next blocks in memory.
          for (const key of blocks.keys()) if (key < start - READ_BLOCK) blocks.delete(key);
        }
        const bytes = await block;
        return bytes.subarray(offset - start, offset - start + Math.min(CHUNK, file.size - offset));
      };
      const pump = async (channel: RTCDataChannel) => {
        while (!t.cancelled) {
          await waitForDrain(channel);
          if (t.cancelled || channel.readyState !== 'open') return;
          if (next >= total) return;
          const index = next++;
          const payload = await chunkAt(index);
          const packet = new Uint8Array(4 + payload.length);
          new DataView(packet.buffer).setUint32(0, index);
          packet.set(payload, 4);
          channel.send(packet);
          t.bytes += payload.length;
        }
      };
      await Promise.all(t.channels.map(pump));
      if (t.cancelled) return;
      // Let everything queued leave before saying we are done.
      await Promise.all(
        t.channels.map(
          (c) =>
            new Promise<void>((resolve) => {
              const check = () => (c.readyState !== 'open' || c.bufferedAmount === 0 ? resolve() : window.setTimeout(check, 50));
              check();
            }),
        ),
      );
      this.send({ t: 'done', tid }, uuid);
      file.sent++;
      window.setTimeout(() => t.channels.forEach((c) => c.close()), 2000);
    } catch {
      this.send({ t: 'gone', tid }, uuid);
    }
    this.transfers.delete(tid);
    this.changed();
  }

  close() {
    this.status = 'closed';
    for (const t of this.transfers.values()) this.stopTransfer(t);
    try {
      this.sdk?.disconnect();
    } catch {
      /* ignore */
    }
    this.sdk = null;
    this.changed();
  }
}

/* ---------------- receiving ---------------- */

export interface Download {
  tid: string;
  file: OfferedFile;
  state: 'requesting' | 'receiving' | 'saving' | 'done' | 'failed';
  bytes: number;
  startedAt: number;
  /** Bytes per second, smoothed. */
  rate: number;
  error?: string;
  result?: File;
  /** Saved straight to disk (large files); no in-memory copy. */
  savedToDisk?: boolean;
}

interface Incoming {
  d: Download;
  total: number;
  chunk: number;
  got: number;
  parts: (Uint8Array | undefined)[];
  writer?: FileSystemWritableFileStream;
  writes: Promise<unknown>;
  doneSignal: boolean;
  lastBytes: number;
  lastTime: number;
}

export class DropReceiver extends EventTarget {
  readonly name: string;
  status: 'connecting' | 'waiting' | 'live' | 'error' | 'closed' = 'connecting';
  error = '';
  files: OfferedFile[] = [];
  downloads = new Map<string, Download>();
  private incoming = new Map<string, Incoming>();
  private sdk: Sdk | null = null;
  private sender: string | null = null;
  private timer = 0;

  constructor(name: string) {
    super();
    this.name = name;
  }

  private changed() {
    this.dispatchEvent(new Event('change'));
  }

  async start() {
    try {
      const sdk = await ninjaClient<Sdk>({ password: passwordFor(this.name) });
      if (this.status === 'closed') return;
      this.sdk = sdk;
      sdk.addEventListener('dataChannelOpen', (e) => {
        const uuid = e.detail?.uuid;
        if (!uuid) return;
        this.sender = uuid;
        this.status = 'live';
        this.send({ t: 'hello' });
        this.changed();
      });
      sdk.addEventListener('peerDisconnected', (e) => {
        if (e.detail?.uuid !== this.sender) return;
        this.sender = null;
        this.status = 'waiting';
        for (const inc of this.incoming.values()) this.fail(inc, 'The sender went offline. Try again when they are back.');
        this.changed();
      });
      sdk.addEventListener('dataReceived', (e) => this.onData(e.detail?.data));
      sdk.addEventListener('channelOpen', (e) => this.onChannel(e.detail?.label, e.detail?.channel));
      await sdk.connect();
      await sdk.view(streamIdFor(this.name), { audio: false, video: false });
      if (this.status === 'connecting') this.status = 'waiting';
      this.timer = window.setInterval(() => this.tick(), 500);
    } catch (error) {
      if (this.status === 'closed') return;
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Could not connect.';
    }
    this.changed();
  }

  private send(msg: Record<string, unknown>) {
    if (!this.sender) return false;
    try {
      return this.sdk?.sendData({ drop: 1, ...msg }, { uuid: this.sender }) ?? false;
    } catch {
      return false;
    }
  }

  private onData(data: { drop?: number; t?: string; files?: OfferedFile[]; tid?: string; chunks?: number; chunk?: number }) {
    if (!data || data.drop !== 1) return;
    if (data.t === 'list' && Array.isArray(data.files)) {
      this.files = data.files.filter(
        (f) => f && typeof f.id === 'string' && typeof f.name === 'string' && Number.isSafeInteger(f.size) && f.size >= 0,
      );
      this.changed();
    } else if (data.t === 'start' && data.tid) {
      const inc = this.incoming.get(data.tid);
      if (!inc) return;
      inc.total = Number(data.chunks) || 0;
      inc.chunk = Number(data.chunk) || CHUNK;
      inc.d.state = 'receiving';
      // Chunks may already have arrived on the lanes before this message.
      if (inc.total === 0 || (inc.doneSignal && inc.got >= inc.total)) void this.finish(inc);
      this.changed();
    } else if (data.t === 'done' && data.tid) {
      const inc = this.incoming.get(data.tid);
      if (!inc) return;
      inc.doneSignal = true;
      if (inc.total === 0 || inc.got >= inc.total) void this.finish(inc);
    } else if (data.t === 'gone' && data.tid) {
      const inc = this.incoming.get(data.tid);
      if (inc) this.fail(inc, 'The sender stopped sharing this file.');
    }
  }

  private onChannel(label: string | undefined, channel: RTCDataChannel | undefined) {
    const match = /dp-([a-z0-9]+)-\d+$/.exec(label || '');
    if (!match || !channel) return;
    const inc = this.incoming.get(match[1]);
    if (!inc) return channel.close();
    channel.binaryType = 'arraybuffer';
    channel.onmessage = (event) => {
      if (!(event.data instanceof ArrayBuffer) || event.data.byteLength < 4) return;
      const index = new DataView(event.data).getUint32(0);
      if (index >= inc.total && inc.total) return;
      const payload = new Uint8Array(event.data, 4);
      if (inc.writer) {
        const position = index * inc.chunk;
        const writer = inc.writer;
        inc.writes = inc.writes.then(() => writer.write({ type: 'write', position, data: payload }));
      } else {
        if (inc.parts[index]) return;
        inc.parts[index] = payload;
      }
      inc.got++;
      inc.d.bytes += payload.length;
      if (inc.doneSignal && inc.total && inc.got >= inc.total) void this.finish(inc);
    };
  }

  /** Ask for a file. Pass a disk writer for big files to stream straight to disk. */
  request(file: OfferedFile, writer?: FileSystemWritableFileStream) {
    if (!this.sender) return;
    const tid = rand(10);
    const d: Download = { tid, file, state: 'requesting', bytes: 0, startedAt: Date.now(), rate: 0 };
    this.downloads.set(file.id, d);
    this.incoming.set(tid, {
      d,
      total: 0,
      chunk: CHUNK,
      got: 0,
      parts: [],
      writer,
      writes: Promise.resolve(),
      doneSignal: false,
      lastBytes: 0,
      lastTime: Date.now(),
    });
    this.send({ t: 'get', id: file.id, tid, lanes: LANES });
    this.changed();
  }

  cancel(fileId: string) {
    const d = this.downloads.get(fileId);
    if (!d) return;
    const inc = this.incoming.get(d.tid);
    if (inc) {
      this.send({ t: 'cancel', tid: d.tid });
      this.fail(inc, 'Cancelled.');
    }
  }

  private fail(inc: Incoming, message: string) {
    if (inc.d.state === 'done' || inc.d.state === 'failed') return;
    inc.d.state = 'failed';
    inc.d.error = message;
    void inc.writer?.abort().catch(() => {});
    this.incoming.delete(inc.d.tid);
    this.changed();
  }

  private async finish(inc: Incoming) {
    if (inc.d.state !== 'receiving' && inc.d.state !== 'requesting') return;
    inc.d.state = 'saving';
    this.changed();
    try {
      if (inc.writer) {
        await inc.writes;
        await inc.writer.close();
        inc.d.savedToDisk = true;
      } else {
        for (let i = 0; i < inc.total; i++) if (!inc.parts[i]) throw new Error('Some pieces were missing.');
        const blob = new Blob(inc.parts as BlobPart[], { type: inc.d.file.type || 'application/octet-stream' });
        if (blob.size !== inc.d.file.size) throw new Error('The file arrived incomplete.');
        inc.d.result = new File([blob], inc.d.file.name, { type: blob.type });
      }
      inc.d.state = 'done';
      inc.parts = [];
    } catch (error) {
      inc.d.state = 'receiving';
      this.fail(inc, error instanceof Error ? error.message : 'Could not save the file.');
      return;
    }
    this.incoming.delete(inc.d.tid);
    this.changed();
  }

  private tick() {
    const now = Date.now();
    let dirty = false;
    for (const inc of this.incoming.values()) {
      const dt = (now - inc.lastTime) / 1000;
      if (dt <= 0) continue;
      const instant = (inc.d.bytes - inc.lastBytes) / dt;
      inc.d.rate = inc.d.rate ? inc.d.rate * 0.6 + instant * 0.4 : instant;
      inc.lastBytes = inc.d.bytes;
      inc.lastTime = now;
      dirty = true;
    }
    if (dirty) this.changed();
  }

  get connected() {
    return !!this.sender;
  }

  close() {
    this.status = 'closed';
    window.clearInterval(this.timer);
    for (const inc of this.incoming.values()) this.fail(inc, 'Closed.');
    try {
      this.sdk?.disconnect();
    } catch {
      /* ignore */
    }
    this.sdk = null;
  }
}
