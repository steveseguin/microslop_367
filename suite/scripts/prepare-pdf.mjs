import { cp, mkdir } from 'node:fs/promises';

// PDF.js fonts, CMaps, and decoders are served from this origin, including offline.
for (const folder of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  await mkdir(`public/pdf-assets/${folder}`, { recursive: true });
  await cp(`node_modules/pdfjs-dist/${folder}`, `public/pdf-assets/${folder}`, {
    recursive: true,
  });
}
await cp('node_modules/pdfjs-dist/LICENSE', 'public/pdf-assets/LICENSE.pdfjs');
