/**
 * pdf.js 6 calls `Math.sumPrecise` (an ES2026 addition) while parsing embedded
 * fonts. Browsers without it throw inside font parsing and silently fall back
 * to substitute fonts, so pages render in the wrong typeface. This shim must
 * run before pdf.js in BOTH the page and the PDF worker. Summing glyph sizes and
 * byte lengths only ever adds integers, so a plain loop is exact here.
 */
const math = Math as Math & { sumPrecise?: (values: Iterable<number>) => number };
if (typeof math.sumPrecise !== 'function') {
  math.sumPrecise = (values: Iterable<number>) => {
    let total = 0;
    for (const value of values) total += value;
    return total;
  };
}
export {};
