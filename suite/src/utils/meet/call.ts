/**
 * A group call on the VDO.Ninja SDK, without the iframe.
 *
 * Everyone publishes one camera/mic stream into a private, password-protected
 * room and subscribes to everyone else. To keep a mesh call light, at most
 * MAX_VIDEO people are received with video; everyone else is received as audio
 * only. Someone who keeps talking is brought onto the video stage in place of
 * whoever has been quiet longest, and anyone can be pinned to it by hand.
 */
import { ninjaClient } from '../ninja';

export const MAX_VIDEO = 4;

type Sdk = {
  addEventListener(type: string, fn: (e: CustomEvent) => void): void;
  connect(): Promise<void>;
  joinRoom(o: { room: string; password?: string | false }): Promise<void>;
  publish(stream: MediaStream, o: { streamID: string; label?: string }): Promise<void>;
  announce(o: { streamID: string; label?: string }): Promise<void>;
  view(streamID: string, o: { audio: boolean; video: boolean }): Promise<unknown>;
  stopViewing(streamID: string): unknown;
  sendData(data: unknown, target?: { uuid: string }): boolean;
  replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): Promise<unknown>;
  addTrack(track: MediaStreamTrack, stream: MediaStream): Promise<unknown>;
  disconnect(): void;
  _stripHashFromStreamID?: (id: string) => string;
};

export interface Person {
  streamID: string;
  uuid: string;
  name: string;
  /** Received media; video tracks only while `video` is true. */
  stream: MediaStream;
  /** Subscribed with video (on the stage). */
  video: boolean;
  /** Pinned to the stage by this viewer. */
  pinned: boolean;
  mic: boolean;
  cam: boolean;
  speaking: boolean;
  lastSpoke: number;
  /** When they started talking without a break, for bringing them on stage. */
  talkStart: number;
  swapping: boolean;
  /** A disconnect arrived mid-swap; checked again once the swap settles. */
  leftDuringSwap?: boolean;
}

const rand = (n: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) =>
    'abcdefghijkmnpqrstuvwxyz23456789'[b % 32],
  ).join('');

export class MeetCall extends EventTarget {
  readonly room: string;
  readonly key: string;
  name: string;
  readonly streamID = `mt${rand(12)}`;
  status: 'connecting' | 'live' | 'error' | 'ended' = 'connecting';
  error = '';
  /** What this device sends. */
  local: MediaStream | null = null;
  mic = true;
  cam = true;
  sharing = false;
  speaking = false;
  people = new Map<string, Person>();
  private sdk: Sdk | null = null;
  private camTrack: MediaStreamTrack | null = null;
  private screenTrack: MediaStreamTrack | null = null;
  private audio: AudioContext | null = null;
  private meters = new Map<string, { analyser: AnalyserNode; buf: Uint8Array<ArrayBuffer>; track: MediaStreamTrack }>();
  private meterTimer = 0;
  private lastAutoSwap = 0;

  constructor(room: string, key: string, name: string) {
    super();
    this.room = room;
    this.key = key;
    this.name = name.trim().slice(0, 40) || 'Guest';
  }

  /** Stream IDs arrive both plain and with the room's password hash appended. */
  private norm(id?: string) {
    if (!id || typeof id !== 'string') return '';
    let clean = id;
    try {
      clean = this.sdk?._stripHashFromStreamID?.(id) ?? id;
    } catch {
      /* keep as is */
    }
    return /^mt[a-z0-9]{12}/.test(clean) ? clean.slice(0, 14) : clean;
  }

  private changed() {
    this.dispatchEvent(new Event('change'));
  }

  /** Camera and microphone, falling back to microphone only, then to nothing. */
  private async getMedia() {
    const tries: MediaStreamConstraints[] = [
      { audio: { echoCancellation: true, noiseSuppression: true }, video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } },
      { audio: true, video: false },
    ];
    for (const constraints of tries) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        /* try the next, smaller ask */
      }
    }
    return null;
  }

  async start() {
    try {
      if (typeof RTCPeerConnection === 'undefined') throw new Error("This browser can't make video calls.");
      this.local = await this.getMedia();
      if (this.ended()) return;
      this.camTrack = this.local?.getVideoTracks()[0] ?? null;
      this.cam = !!this.camTrack;
      this.updatePreview();
      this.mic = !!this.local?.getAudioTracks().length;
      this.changed();
      const sdk = await ninjaClient<Sdk>();
      if (this.ended()) return;
      this.sdk = sdk;

      const seen = (raw?: string, label?: string, uuid?: string) => {
        const streamID = this.norm(raw);
        if (!streamID || streamID === this.streamID) return;
        this.addPerson(streamID, label, uuid);
      };
      sdk.addEventListener('listing', (e) => {
        if (e.detail?.streamID) seen(e.detail.streamID, e.detail.label, e.detail.uuid);
        else for (const item of e.detail?.list || []) seen(item.streamID, item.label);
      });
      sdk.addEventListener('videoaddedtoroom', (e) => seen(e.detail?.streamID, e.detail?.raw?.label, e.detail?.uuid));
      sdk.addEventListener('track', (e) => this.onTrack(e.detail));
      sdk.addEventListener('dataChannelOpen', (e) => {
        if (e.detail?.uuid) this.sendState(e.detail.uuid);
      });
      sdk.addEventListener('dataReceived', (e) => this.onData(e.detail));
      // Leaving the room is final; a dropped connection may just be a video/audio swap.
      sdk.addEventListener('userLeft', (e) => this.onLeft(e.detail?.uuid || e.detail?.UUID, e.detail?.streamID, true));
      sdk.addEventListener('peerDisconnected', (e) => this.onLeft(e.detail?.uuid || e.detail?.UUID, e.detail?.streamID, false));
      sdk.addEventListener('disconnected', () => {
        if (this.status === 'live') {
          this.status = 'connecting';
          this.changed();
        }
      });
      sdk.addEventListener('reconnected', () => {
        if (this.status === 'connecting') {
          this.status = 'live';
          this.changed();
        }
      });

      await sdk.connect();
      if (this.ended()) return;
      await sdk.joinRoom({ room: this.room, password: this.key });
      if (this.ended()) return;
      if (this.local) await sdk.publish(this.local, { streamID: this.streamID, label: this.name });
      else await sdk.announce({ streamID: this.streamID, label: this.name });
      if (this.ended()) return;
      this.status = 'live';
      this.meterTimer = window.setInterval(() => this.measure(), 150);
      if (this.local?.getAudioTracks()[0]) this.meter('', this.local.getAudioTracks()[0]);
    } catch (error) {
      if (this.ended()) return;
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Could not join the meeting.';
    }
    this.changed();
  }

  /** Left while still starting: tear down whatever got set up since. */
  private ended() {
    if (this.status !== 'ended') return false;
    try {
      this.sdk?.disconnect();
    } catch {
      /* ignore */
    }
    this.sdk = null;
    this.local?.getTracks().forEach((t) => t.stop());
    return true;
  }

  private videoCount() {
    let n = 0;
    for (const p of this.people.values()) if (p.video) n++;
    return n;
  }

  private addPerson(streamID: string, label?: string, uuid?: string) {
    const existing = this.people.get(streamID);
    if (existing) {
      if (label && existing.name === 'Guest') existing.name = String(label).slice(0, 40);
      return;
    }
    const video = this.videoCount() < MAX_VIDEO;
    this.people.set(streamID, {
      streamID,
      uuid: uuid || '',
      name: label ? String(label).slice(0, 40) : 'Guest',
      stream: new MediaStream(),
      video,
      pinned: false,
      mic: true,
      cam: true,
      speaking: false,
      lastSpoke: 0,
      talkStart: 0,
      swapping: false,
    });
    void this.sdk?.view(streamID, { audio: true, video });
    this.changed();
  }

  private onTrack(detail: { track: MediaStreamTrack; uuid: string; streamID?: string }) {
    const { track, uuid } = detail;
    detail = { ...detail, streamID: this.norm(detail.streamID) };
    let person = detail.streamID ? this.people.get(detail.streamID) : undefined;
    if (!person) for (const p of this.people.values()) if (p.uuid === uuid) person = p;
    if (!person && detail.streamID && detail.streamID !== this.streamID) {
      this.addPerson(detail.streamID, undefined, uuid);
      person = this.people.get(detail.streamID);
    }
    if (!person) return;
    person.uuid = uuid || person.uuid;
    // A person who is audio-only should not show video even if a track slips through.
    if (track.kind === 'video' && !person.video) return;
    for (const old of person.stream.getTracks()) if (old.kind === track.kind) person.stream.removeTrack(old);
    // A fresh MediaStream object makes <video>/<audio> elements pick up the change.
    person.stream = new MediaStream([...person.stream.getTracks(), track]);
    track.addEventListener('ended', () => {
      const p = this.people.get(person!.streamID);
      if (!p) return;
      p.stream = new MediaStream(p.stream.getTracks().filter((t) => t !== track));
      this.changed();
    });
    if (track.kind === 'audio') this.meter(person.streamID, track);
    person.leftDuringSwap = false;
    this.changed();
  }

  private onData(detail: { data?: { meet?: { name?: string; mic?: boolean; cam?: boolean } }; uuid?: string; streamID?: string }) {
    const info = detail?.data?.meet;
    if (!info || typeof info !== 'object') return;
    detail = { ...detail, streamID: this.norm(detail.streamID) };
    let person = detail.streamID ? this.people.get(detail.streamID) : undefined;
    if (!person) for (const p of this.people.values()) if (p.uuid && p.uuid === detail.uuid) person = p;
    if (!person) return;
    if (typeof info.name === 'string' && info.name.trim()) person.name = info.name.trim().slice(0, 40);
    if (typeof info.mic === 'boolean') person.mic = info.mic;
    if (typeof info.cam === 'boolean') person.cam = info.cam;
    this.changed();
  }

  private sendState(uuid?: string) {
    try {
      this.sdk?.sendData(
        { meet: { name: this.name, mic: this.mic, cam: this.cam && !!this.camTrack } },
        uuid ? { uuid } : undefined,
      );
    } catch {
      /* channel not ready; they get it on open */
    }
  }

  private onLeft(uuid?: string, rawStreamID?: string, final = false) {
    const streamID = this.norm(rawStreamID);
    let person = streamID ? this.people.get(streamID) : undefined;
    if (!person && uuid) for (const p of this.people.values()) if (p.uuid === uuid) person = p;
    if (!person) return;
    if (person.swapping && !final) {
      person.leftDuringSwap = true;
      return;
    }
    this.people.delete(person.streamID);
    this.unmeter(person.streamID);
    this.fillStage();
    this.changed();
  }

  /** Bring audio-only people onto free video slots. */
  private fillStage() {
    const waiting = [...this.people.values()]
      .filter((p) => !p.video && !p.swapping)
      .sort((a, b) => b.lastSpoke - a.lastSpoke);
    for (const p of waiting) {
      if (this.videoCount() >= MAX_VIDEO) break;
      void this.resubscribe(p, true);
    }
  }

  /** Switch someone between video and audio-only by subscribing again. */
  private async resubscribe(person: Person, video: boolean) {
    if (!this.sdk || person.video === video || person.swapping) return;
    person.swapping = true;
    person.video = video;
    if (!video) person.stream = new MediaStream(person.stream.getAudioTracks());
    this.changed();
    try {
      await this.sdk.stopViewing(person.streamID);
      await new Promise((r) => setTimeout(r, 250));
      if (this.people.has(person.streamID)) await this.sdk.view(person.streamID, { audio: true, video });
    } catch {
      /* they may have left meanwhile */
    }
    person.leftDuringSwap = false;
    const fresh = () => person.stream.getTracks().some((t) => t.readyState === 'live');
    window.setTimeout(() => {
      person.swapping = false;
      // Still nothing flowing and they dropped meanwhile: they have gone.
      if (person.leftDuringSwap && !fresh() && this.people.get(person.streamID) === person) {
        this.onLeft(person.uuid, person.streamID, true);
      }
    }, 4000);
  }

  /** Put someone on the video stage (pinned), moving the quietest person off it. */
  setVideo(streamID: string, on: boolean) {
    const person = this.people.get(streamID);
    if (!person) return;
    person.pinned = on;
    this.changed();
    if (!on || person.video) return; // unpinning leaves them where they are
    if (this.videoCount() >= MAX_VIDEO) {
      const out = this.quietestOnStage(streamID);
      if (!out) return;
      void this.resubscribe(out, false);
    }
    void this.resubscribe(person, true);
  }

  private quietestOnStage(except: string) {
    return [...this.people.values()]
      .filter((p) => p.video && !p.pinned && p.streamID !== except && !p.swapping)
      .sort((a, b) => a.lastSpoke - b.lastSpoke)[0];
  }

  /* ---------------- speaking ---------------- */

  private meter(id: string, track: MediaStreamTrack) {
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume();
      this.unmeter(id);
      const source = this.audio.createMediaStreamSource(new MediaStream([track]));
      const analyser = this.audio.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      this.meters.set(id, { analyser, buf: new Uint8Array(new ArrayBuffer(analyser.fftSize)), track });
    } catch {
      /* no speaking indicator for this one */
    }
  }

  private unmeter(id: string) {
    this.meters.delete(id);
  }

  private measure() {
    const now = Date.now();
    let dirty = false;
    for (const [id, m] of this.meters) {
      if (m.track.readyState === 'ended') continue;
      m.analyser.getByteTimeDomainData(m.buf);
      let sum = 0;
      for (const v of m.buf) sum += (v - 128) * (v - 128);
      const level = Math.sqrt(sum / m.buf.length) / 128;
      const talking = level > 0.04;
      if (id === '') {
        const s = talking && this.mic;
        if (s !== this.speaking) {
          this.speaking = s;
          dirty = true;
        }
        continue;
      }
      const p = this.people.get(id);
      if (!p) continue;
      if (talking) {
        if (!p.speaking) p.talkStart = now;
        p.lastSpoke = now;
      }
      // Stay "speaking" briefly through natural pauses.
      const speaking = now - p.lastSpoke < 600;
      if (speaking !== p.speaking) {
        p.speaking = speaking;
        if (!speaking) p.talkStart = 0;
        dirty = true;
      }
    }
    // A free video slot (someone left, or a swap just settled): fill it.
    if (this.videoCount() < MAX_VIDEO) this.fillStage();

    // Someone audio-only has been talking for a while: give them a video slot.
    if (now - this.lastAutoSwap > 8000) {
      const talker = [...this.people.values()].find(
        (p) => !p.video && !p.swapping && p.speaking && p.talkStart && now - p.talkStart > 1500,
      );
      if (talker) {
        const out = this.videoCount() >= MAX_VIDEO ? this.quietestOnStage(talker.streamID) : null;
        if (this.videoCount() < MAX_VIDEO || (out && now - out.lastSpoke > 5000)) {
          this.lastAutoSwap = now;
          if (out) void this.resubscribe(out, false);
          void this.resubscribe(talker, true);
        }
      }
    }
    if (dirty) this.changed();
  }

  /* ---------------- my controls ---------------- */

  toggleMic() {
    const track = this.local?.getAudioTracks()[0];
    if (!track) return;
    this.mic = !this.mic;
    track.enabled = this.mic;
    this.sendState();
    this.changed();
  }

  toggleCam() {
    if (!this.camTrack) return;
    this.cam = !this.cam;
    this.camTrack.enabled = this.cam;
    this.sendState();
    this.changed();
  }

  async shareScreen() {
    if (this.sharing) return this.stopShare();
    if (!this.sdk || !this.local) return;
    let display: MediaStream;
    try {
      display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15 } }, audio: false });
    } catch {
      return; // cancelled
    }
    const track = display.getVideoTracks()[0];
    if (!track) return;
    track.contentHint = 'detail';
    this.screenTrack = track;
    try {
      if (this.camTrack) {
        await this.sdk.replaceTrack(this.camTrack, track);
      } else {
        await this.sdk.addTrack(track, this.local);
      }
    } catch {
      track.stop();
      this.screenTrack = null;
      return;
    }
    this.sharing = true;
    this.updatePreview();
    track.addEventListener('ended', () => void this.stopShare());
    this.changed();
  }

  async stopShare() {
    const track = this.screenTrack;
    if (!track || !this.sdk) return;
    this.screenTrack = null;
    this.sharing = false;
    try {
      if (this.camTrack) await this.sdk.replaceTrack(track, this.camTrack);
    } catch {
      /* the call carries on without video */
    }
    track.stop();
    this.updatePreview();
    this.changed();
  }

  /** What to show in my own preview. */
  preview: MediaStream | null = null;
  private updatePreview() {
    const track = this.screenTrack ?? this.camTrack;
    this.preview = track ? new MediaStream([track]) : null;
  }

  leave() {
    this.status = 'ended';
    window.clearInterval(this.meterTimer);
    try {
      this.sdk?.disconnect();
    } catch {
      /* ignore */
    }
    this.sdk = null;
    this.local?.getTracks().forEach((t) => t.stop());
    this.screenTrack?.stop();
    void this.audio?.close().catch(() => {});
    this.meters.clear();
    this.people.clear();
    this.changed();
  }
}
