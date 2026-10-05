/**
 * Yjs over a LiveSession: conflict-free simultaneous editing plus presence
 * (names, colours, cursors). Any editor can bring a newcomer up to date, so the
 * person who shared can leave and the others keep working together.
 */
import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import type { LiveSession } from './session';

/** Message types that change the document and must be signed. */
export const Y_SIGNED = ['y', 'ys2'];

export class LiveYProvider {
  readonly doc: Y.Doc;
  readonly awareness: Awareness;
  readonly session: LiveSession;
  /** True once this copy has content from someone (or was seeded locally). */
  synced = false;
  private stop: (() => void)[] = [];

  constructor(session: LiveSession, doc: Y.Doc, seeded: boolean) {
    this.session = session;
    this.doc = doc;
    this.synced = seeded;
    this.awareness = new Awareness(doc);
    this.awareness.setLocalStateField('user', { name: session.me.name, color: session.me.color });

    const onUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== this) void session.send('y', update);
    };
    doc.on('update', onUpdate);
    this.stop.push(() => doc.off('update', onUpdate));

    const onAwareness = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      if (origin === this) return;
      const changed = [...added, ...updated, ...removed];
      void session.send('aw', encodeAwarenessUpdate(this.awareness, changed));
    };
    this.awareness.on('update', onAwareness);
    this.stop.push(() => this.awareness.off('update', onAwareness));

    const onPeer = (e: Event) => {
      const uuid = (e as CustomEvent<string>).detail;
      void session.send('ys1', Y.encodeStateVector(doc), uuid);
      void session.send('aw', encodeAwarenessUpdate(this.awareness, [doc.clientID]), uuid);
    };
    session.addEventListener('peer-open', onPeer);
    this.stop.push(() => session.removeEventListener('peer-open', onPeer));

    const onMessage = (e: Event) => {
      const { type, payload, from } = (e as CustomEvent<{ type: string; payload: unknown; from: string }>).detail;
      if (!(payload instanceof Uint8Array)) return;
      try {
        if (type === 'ys1') {
          // Only editors answer: the answer carries content and is signed.
          if (session.mode === 'edit') {
            const missing = Y.encodeStateAsUpdate(doc, payload);
            // An update with nothing in it is two bytes; skip those.
            if (missing.length > 2) void session.send('ys2', missing, from);
          }
        } else if (type === 'y' || type === 'ys2') {
          Y.applyUpdate(doc, payload, this);
          if (!this.synced) {
            this.synced = true;
            session.dispatchEvent(new CustomEvent('synced'));
          }
        } else if (type === 'aw') {
          applyAwarenessUpdate(this.awareness, payload, this);
        }
      } catch {
        /* a malformed update is ignored */
      }
    };
    session.addEventListener('message', onMessage);
    this.stop.push(() => session.removeEventListener('message', onMessage));

    // Every few seconds, ask the others for anything this copy missed (a dropped
    // message, or a guest whose changes could not reach us directly).
    const catchUp = window.setInterval(() => {
      if (session.peers.size) void session.send('ys1', Y.encodeStateVector(doc));
    }, 5_000);
    this.stop.push(() => window.clearInterval(catchUp));

    // Re-announce presence periodically so cursors don't time out while idle.
    const keepAlive = window.setInterval(() => {
      this.awareness.setLocalStateField('user', { name: session.me.name, color: session.me.color });
    }, 15_000);
    this.stop.push(() => window.clearInterval(keepAlive));
  }

  destroy() {
    this.stop.forEach((f) => f());
    this.awareness.destroy();
  }
}
