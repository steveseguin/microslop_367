/**
 * The "back up everything" file: one JSON file with every document, design and
 * tool workspace, optionally encrypted with a password (AES-GCM, key from
 * PBKDF2-SHA-256). Restoring merges into what is here; it never wipes.
 */
import { buildSnapshot, decodeJson, encodeJson } from './snapshot';
import type { Snapshot } from './snapshot';

const ITERATIONS = 310_000;
const LAST_BACKUP_KEY = 'officeninja_last_backup';

interface Envelope {
  app: 'officeninja-backup';
  v: 1;
  created: number;
  encrypted: boolean;
  salt?: string;
  iv?: string;
  data: string;
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function keyFrom(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function bytesToB64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export async function makeBackup(password?: string): Promise<{ blob: Blob; snapshot: Snapshot }> {
  const snapshot = await buildSnapshot();
  const json = encodeJson(snapshot);
  let envelope: Envelope;
  if (password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await keyFrom(password, salt);
    const cipher = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(json)),
    );
    envelope = {
      app: 'officeninja-backup',
      v: 1,
      created: snapshot.created,
      encrypted: true,
      salt: b64(salt),
      iv: b64(iv),
      data: bytesToB64(cipher),
    };
  } else {
    envelope = {
      app: 'officeninja-backup',
      v: 1,
      created: snapshot.created,
      encrypted: false,
      data: json,
    };
  }
  return {
    blob: new Blob([JSON.stringify(envelope)], { type: 'application/json' }),
    snapshot,
  };
}

export function isEncryptedBackup(text: string) {
  try {
    const env = JSON.parse(text) as Partial<Envelope>;
    return env.app === 'officeninja-backup' && env.encrypted === true;
  } catch {
    return false;
  }
}

export async function readBackup(text: string, password?: string): Promise<Snapshot> {
  let env: Envelope;
  try {
    env = JSON.parse(text);
  } catch {
    throw new Error('That file is not an OfficeNinja backup.');
  }
  if (env?.app !== 'officeninja-backup' || env.v !== 1 || typeof env.data !== 'string')
    throw new Error('That file is not an OfficeNinja backup.');
  if (!env.encrypted) return decodeJson<Snapshot>(env.data);
  if (!password) throw new Error('This backup is password-protected. Enter its password.');
  try {
    const key = await keyFrom(password, unb64(env.salt!));
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unb64(env.iv!) as BufferSource },
      key,
      unb64(env.data) as BufferSource,
    );
    return decodeJson<Snapshot>(new TextDecoder().decode(plain));
  } catch {
    throw new Error('Wrong password, or the backup file is damaged.');
  }
}

export function backupFileName(date = new Date()) {
  const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `officeninja-backup-${d}.json`;
}

export function markBackedUp(where: string) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, JSON.stringify({ t: Date.now(), where }));
  } catch {
    /* ignore */
  }
}
export function lastBackup(): { t: number; where: string } | null {
  try {
    return JSON.parse(localStorage.getItem(LAST_BACKUP_KEY) || 'null');
  } catch {
    return null;
  }
}
