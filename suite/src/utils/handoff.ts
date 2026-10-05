/**
 * Hands a file dropped on the workspace to the editor that opens it. The file
 * lives in memory only for the length of one in-app navigation; a reload drops
 * it, which is the right outcome for a drag the user can simply repeat.
 */
export type HandoffKind =
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'pdf'
  | 'image'
  | 'svg';

let pending: { kind: HandoffKind; file: File } | null = null;

export function handOff(kind: HandoffKind, file: File) {
  pending = { kind, file };
}

export function takeHandoff(kind: HandoffKind): File | null {
  if (pending?.kind !== kind) return null;
  const { file } = pending;
  pending = null;
  return file;
}

export function kindForFile(file: File): HandoffKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.docx')) return 'word';
  if (/\.(xlsx|xls|csv)$/.test(name)) return 'excel';
  if (name.endsWith('.pptx')) return 'powerpoint';
  if (name.endsWith('.svg') || file.type === 'image/svg+xml') return 'svg';
  if (
    /\.(png|jpe?g|webp|gif|bmp|avif|ico)$/.test(name) ||
    (file.type.startsWith('image/') && file.type !== 'image/svg+xml')
  )
    return 'image';
  return null;
}
