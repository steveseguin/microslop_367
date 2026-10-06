/**
 * Files already in NinjaOffice, offered for NinjaDrop without re-uploading.
 *
 * Office documents and Blueline designs travel as small ".ninja.json" packages
 * that the receiver opens straight into the same app. PDFs, images and SVGs
 * travel as ordinary files.
 */
import { listDocuments, loadDocument, saveDocument } from '../db';
import type { OfficeDocumentType } from '../db';
import { allDesignFiles, designUrl, putDesignIfNewer } from '../blueline';
import { readToolRecord, writeToolWorkspace } from '../toolStorage';
import type { BoardData, BoardsWorkspace } from '../board/types';
import { handOff, kindForFile } from '../handoff';
import type { HandoffKind } from '../handoff';

export type LibraryKind = OfficeDocumentType | 'blueline' | 'board' | 'pdf' | 'image' | 'svg' | 'note';

export interface LibraryItem {
  key: string;
  kind: LibraryKind;
  title: string;
  updated: number;
  /** Build the file to send. */
  make: () => Promise<{ blob: Blob; name: string; type: string }>;
}

const PACKAGE = 'ninjaoffice-file';
const safe = (name: string) => name.replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 120) || 'untitled';
const json = (value: unknown) => new Blob([JSON.stringify(value)], { type: 'application/json' });

export async function listLibrary(): Promise<LibraryItem[]> {
  const items: LibraryItem[] = [];
  try {
    for (const doc of await listDocuments()) {
      items.push({
        key: `doc:${doc.id}`,
        kind: doc.type,
        title: doc.title,
        updated: doc.updatedAt,
        make: async () => {
          const full = await loadDocument(doc.id);
          if (!full) throw new Error(`${doc.title} could not be read.`);
          return {
            blob: json({ format: PACKAGE, version: 1, kind: doc.type, title: full.title, data: full.data }),
            name: `${safe(full.title)}.${doc.type}.ninja.json`,
            type: 'application/json',
          };
        },
      });
    }
  } catch {
    /* storage unavailable: offer the rest */
  }
  try {
    for (const design of await allDesignFiles()) {
      items.push({
        key: `design:${design.id}`,
        kind: 'blueline',
        title: design.name || 'Untitled design',
        updated: Number(design.updated) || 0,
        make: async () => ({
          blob: json({ format: PACKAGE, version: 1, kind: 'blueline', title: design.name, data: design }),
          name: `${safe(design.name || 'design')}.blueline.ninja.json`,
          type: 'application/json',
        }),
      });
    }
  } catch {
    /* no Blueline files */
  }
  const tool = async <T,>(key: string) => {
    try {
      return await readToolRecord<T>(key);
    } catch {
      return null;
    }
  };
  const pdf = await tool<{ name: string; bytes: Uint8Array | null }>('pdf');
  if (pdf?.data.bytes?.length) {
    const { name, bytes } = pdf.data;
    items.push({
      key: 'tool:pdf',
      kind: 'pdf',
      title: name || 'document.pdf',
      updated: pdf.savedAt ?? 0,
      make: async () => ({ blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), name: /\.pdf$/i.test(name) ? name : `${safe(name)}.pdf`, type: 'application/pdf' }),
    });
  }
  const image = await tool<{ name: string; png: Uint8Array | null }>('image');
  if (image?.data.png?.length) {
    const { name, png } = image.data;
    items.push({
      key: 'tool:image',
      kind: 'image',
      title: `${name || 'image'}.png`,
      updated: image.savedAt ?? 0,
      make: async () => ({ blob: new Blob([png as BlobPart], { type: 'image/png' }), name: `${safe(name || 'image')}.png`, type: 'image/png' }),
    });
  }
  const svg = await tool<{ name: string; code: string }>('svg');
  if (svg?.data.code) {
    const { name, code } = svg.data;
    items.push({
      key: 'tool:svg',
      kind: 'svg',
      title: `${name || 'drawing'}.svg`,
      updated: svg.savedAt ?? 0,
      make: async () => ({ blob: new Blob([code], { type: 'image/svg+xml' }), name: `${safe(name || 'drawing')}.svg`, type: 'image/svg+xml' }),
    });
  }
  const boards = await tool<BoardsWorkspace>('boards');
  for (const board of boards?.data.boards ?? []) {
    items.push({
      key: `board:${board.id}`,
      kind: 'board',
      title: board.title || 'Untitled board',
      updated: board.updated,
      make: async () => ({
        blob: json({ format: PACKAGE, version: 1, kind: 'board', title: board.title, data: board }),
        name: `${safe(board.title || 'board')}.board.ninja.json`,
        type: 'application/json',
      }),
    });
  }
  const notes = await tool<{ notes: { id: string; title: string; body: string; updated: number }[] }>('notes');
  for (const note of notes?.data.notes ?? []) {
    items.push({
      key: `note:${note.id}`,
      kind: 'note',
      title: note.title || 'Untitled note',
      updated: note.updated,
      make: async () => ({
        blob: new Blob([`# ${note.title || 'Untitled note'}\n\n${note.body}`], { type: 'text/markdown' }),
        name: `${safe(note.title || 'note')}.md`,
        type: 'text/markdown',
      }),
    });
  }
  return items.sort((a, b) => b.updated - a.updated);
}

const APP_NAMES: Record<string, string> = {
  word: 'NinjaWord',
  excel: 'NinjaCalc',
  powerpoint: 'NinjaSlides',
  blueline: 'Blueline',
  board: 'NinjaBoard',
  pdf: 'NinjaPDF',
  image: 'NinjaImage',
  svg: 'NinjaSVG',
};

/** Which app a received file opens in, if any. */
export function opensIn(file: File): string | null {
  if (/\.ninja\.json$/i.test(file.name)) {
    const kind = /\.(word|excel|powerpoint|blueline|board)\.ninja\.json$/i.exec(file.name)?.[1]?.toLowerCase();
    return kind ? APP_NAMES[kind] : null;
  }
  const kind = kindForFile(file);
  return kind && kind !== 'word' ? APP_NAMES[kind] : null;
}

/**
 * Open a received file in its app. Returns the in-app route to go to, or an
 * absolute URL for Blueline.
 */
export async function openReceived(file: File): Promise<{ route?: string; href?: string }> {
  if (/\.ninja\.json$/i.test(file.name)) {
    const pkg = JSON.parse(await file.text()) as { format?: string; kind?: string; title?: string; data?: unknown };
    if (pkg.format !== PACKAGE) throw new Error('This is not a NinjaOffice file.');
    const id = `${pkg.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (pkg.kind === 'word' || pkg.kind === 'excel' || pkg.kind === 'powerpoint') {
      const result = await saveDocument(id, String(pkg.title || 'Shared file').slice(0, 200), pkg.kind, pkg.data);
      if (result.status !== 'saved') throw new Error('Could not save it to your files.');
      return { route: `/${pkg.kind}?id=${id}` };
    }
    if (pkg.kind === 'blueline' && pkg.data && typeof pkg.data === 'object') {
      const design = { ...(pkg.data as Record<string, unknown>), id, updated: Date.now() };
      await putDesignIfNewer(design as Parameters<typeof putDesignIfNewer>[0]);
      return { href: designUrl(id) };
    }
    if (pkg.kind === 'board' && pkg.data && typeof pkg.data === 'object') {
      const board = { ...(pkg.data as BoardData), id: `board-${id}`, updated: Date.now() };
      const current = (await readToolRecord<BoardsWorkspace>('boards'))?.data ?? { version: 1 as const, boards: [] };
      await writeToolWorkspace('boards', { ...current, boards: [board, ...current.boards] });
      return { route: `/board?id=${board.id}` };
    }
    throw new Error('This NinjaOffice file type is not supported here.');
  }
  const kind = kindForFile(file) as HandoffKind | null;
  if (!kind || kind === 'word') throw new Error('No app here opens this kind of file.');
  handOff(kind, file);
  return { route: `/${kind}` };
}
