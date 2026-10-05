// The PDF worker entry: shim first, then pdf.js's own worker.
import './sumPrecise';
import 'pdfjs-dist/build/pdf.worker.min.mjs';
