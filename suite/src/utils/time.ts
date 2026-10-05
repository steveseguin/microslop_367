export interface TimeEntry {
  id: string;
  description: string;
  client: string;
  project: string;
  date: string;
  seconds: number;
  rate: number;
  billable: boolean;
  /** Invoice lines only: typed in by hand (editable quantity and rate). */
  manual?: boolean;
  /** Invoice lines only: quantity (hours or units) for manual lines. */
  quantity?: number;
}
export interface Timer extends Omit<TimeEntry, 'seconds'> {
  started: number;
}
export interface Invoice {
  id: string;
  number: string;
  date: string;
  due: string;
  client: string;
  from: string;
  address: string;
  notes: string;
  currency: string;
  tax: number;
  discount: number;
  paid: boolean;
  lines: TimeEntry[];
}
export interface TimeWorkspace {
  version: 1;
  entries: TimeEntry[];
  timer: Timer | null;
  invoices: Invoice[];
  business: string;
  currency: string;
  nextInvoice: number;
}
export const EMPTY_TIME: TimeWorkspace = {
  version: 1,
  entries: [],
  timer: null,
  invoices: [],
  business: '',
  currency: 'USD',
  nextInvoice: 1,
};
export const CURRENCIES = [
  'USD',
  'CAD',
  'EUR',
  'GBP',
  'AUD',
  'NZD',
  'JPY',
  'INR',
  'CHF',
];
export function minorDigits(currency: string) {
  return (
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}
/** Hours (time lines) or quantity (manual lines) billed on a line. */
export function lineQuantity(entry: TimeEntry) {
  return typeof entry.quantity === 'number'
    ? entry.quantity
    : entry.seconds / 3600;
}
export function lineAmount(entry: TimeEntry, currency: string) {
  return Math.round(
    lineQuantity(entry) * entry.rate * 10 ** minorDigits(currency),
  );
}
export function invoiceTotals(invoice: Invoice) {
  const factor = 10 ** minorDigits(invoice.currency);
  const subtotal = invoice.lines.reduce(
    (sum, line) => sum + lineAmount(line, invoice.currency),
    0,
  );
  const discount = Math.min(subtotal, Math.round(invoice.discount * factor));
  const tax = Math.round(((subtotal - discount) * invoice.tax) / 100);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}
export function money(minor: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(minor / 10 ** minorDigits(currency));
}
export function duration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const isText = (v: unknown): v is string =>
  typeof v === 'string' && v.length <= 100_000;
const isNum = (v: unknown, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
const isDate = (v: unknown) =>
  typeof v === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v));
const baseEntry = (v: Record<string, unknown>) =>
  isText(v.id) &&
  isText(v.description) &&
  isText(v.client) &&
  isText(v.project) &&
  isDate(v.date) &&
  isNum(v.rate, 1_000_000) &&
  typeof v.billable === 'boolean';
const validEntry = (v: unknown) =>
  isObj(v) &&
  baseEntry(v) &&
  isNum(v.seconds, 315_360_000) &&
  (v.manual === undefined || typeof v.manual === 'boolean') &&
  (v.quantity === undefined || isNum(v.quantity, 1_000_000));

/** One invoice. Older backups always had lines; blank invoices may have none. */
export function validInvoice(v: unknown): v is Invoice {
  return (
    isObj(v) &&
    ['id', 'number', 'client', 'from', 'address', 'notes'].every((k) =>
      isText(v[k]),
    ) &&
    isDate(v.date) &&
    isDate(v.due) &&
    CURRENCIES.includes(String(v.currency)) &&
    isNum(v.tax, 100) &&
    isNum(v.discount, 1e12) &&
    typeof v.paid === 'boolean' &&
    Array.isArray(v.lines) &&
    v.lines.length <= 5000 &&
    v.lines.every(validEntry) &&
    new Set(v.lines.map((l: TimeEntry) => l.id)).size === v.lines.length
  );
}

export function validTimeBackup(value: unknown): value is TimeWorkspace {
  if (
    !isObj(value) ||
    value.version !== 1 ||
    !isText(value.business) ||
    !CURRENCIES.includes(String(value.currency)) ||
    !isNum(value.nextInvoice, 1e9) ||
    !Number.isInteger(value.nextInvoice) ||
    Number(value.nextInvoice) < 1
  )
    return false;
  if (
    !Array.isArray(value.entries) ||
    !value.entries.every(validEntry) ||
    new Set(value.entries.map((e) => e.id)).size !== value.entries.length
  )
    return false;
  if (
    value.timer !== null &&
    !(
      isObj(value.timer) &&
      baseEntry(value.timer) &&
      isNum(value.timer.started, Date.now())
    )
  )
    return false;
  if (!Array.isArray(value.invoices) || !value.invoices.every(validInvoice))
    return false;
  return (
    new Set(value.invoices.map((i) => i.id)).size === value.invoices.length
  );
}

// ---- Invoices: status, single-invoice files, copies, PDF ------------------

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';
export function invoiceStatus(invoice: Invoice, today: string): InvoiceStatus {
  if (invoice.paid) return 'Paid';
  return invoice.due < today ? 'Overdue' : 'Unpaid';
}

export const INVOICE_FILE_TYPE = 'ninjatime-invoice';
export interface InvoiceFile {
  type: typeof INVOICE_FILE_TYPE;
  version: 1;
  invoice: Invoice;
}
export function invoiceFile(invoice: Invoice): InvoiceFile {
  return { type: INVOICE_FILE_TYPE, version: 1, invoice };
}
export function validInvoiceFile(value: unknown): value is InvoiceFile {
  return (
    isObj(value) &&
    value.type === INVOICE_FILE_TYPE &&
    value.version === 1 &&
    validInvoice(value.invoice)
  );
}

/** A manual line (not linked to any time entry). */
export function manualLine(
  invoice: Pick<Invoice, 'client' | 'date'>,
  description = '',
  quantity = 1,
  rate = 0,
): TimeEntry {
  return {
    id: crypto.randomUUID(),
    description,
    client: invoice.client,
    project: '',
    date: invoice.date,
    rate,
    billable: true,
    manual: true,
    quantity,
    seconds: manualSeconds(quantity),
  };
}
/** Seconds kept on manual lines for older readers that only know seconds. */
export const manualSeconds = (quantity: number) =>
  Math.min(315_360_000, Math.max(0, Math.round(quantity * 3600)));

/**
 * Detach lines from time entries: new ids, editable snapshots. Used for
 * copies and imports so no time entry ever looks billed twice.
 */
export function detachedLines(lines: TimeEntry[]): TimeEntry[] {
  return lines.map((line) => {
    const quantity = Math.round(lineQuantity(line) * 1e4) / 1e4;
    return {
      ...line,
      id: crypto.randomUUID(),
      manual: true,
      quantity,
      seconds: manualSeconds(quantity),
    };
  });
}

/** "INV-0001", or "INV-0001 (imported)", "(imported 2)"… when taken. */
export function uniqueNumber(number: string, taken: string[]) {
  const used = new Set(taken.map((n) => n.trim().toLowerCase()));
  const base = number.trim() || 'Imported invoice';
  if (!used.has(base.toLowerCase())) return base;
  for (let i = 1; ; i++) {
    const next = `${base} (imported${i > 1 ? ` ${i}` : ''})`;
    if (!used.has(next.toLowerCase())) return next;
  }
}

/** Quantity column text: h:mm:ss for tracked time, a plain number otherwise. */
export function lineQuantityText(line: TimeEntry) {
  if (!line.manual) return duration(line.seconds);
  return String(Math.round(lineQuantity(line) * 1e4) / 1e4);
}

/** A real PDF of the invoice (pdf-lib, Helvetica), loaded only when asked for. */
export async function invoicePdf(invoice: Invoice): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${invoice.number}`);
  pdf.setCreator('NinjaTime');
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const charset = new Set(font.getCharacterSet());
  // Helvetica only covers Latin-1 (WinAnsi): swap or drop anything else.
  const clean = (value: string) =>
    [
      ...value
        .replace(/[\u2212\u2013\u2014]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/\u2026/g, '...')
        .replace(/\u20b9/g, 'Rs ')
        .replace(/\r/g, '')
        .replace(/[\u00a0\u202f\u2009\t]/g, ' '),
    ]
      .map((ch) =>
        ch === '\n' || charset.has(ch.codePointAt(0) ?? 0) ? ch : '?',
      )
      .join('');
  const ink = rgb(0.09, 0.13, 0.2);
  const muted = rgb(0.38, 0.43, 0.5);
  const rule = rgb(0.86, 0.89, 0.92);
  const band = rgb(0.95, 0.96, 0.98);
  const green = rgb(0.04, 0.42, 0.24);
  const letter = invoice.currency === 'USD' || invoice.currency === 'CAD';
  const [W, H] = letter ? [612, 792] : [595.28, 841.89];
  const M = 50;
  const right = W - M;
  type Font = typeof font;
  const wrap = (value: string, f: Font, size: number, width: number) => {
    const out: string[] = [];
    for (const para of clean(value).split('\n')) {
      let line = '';
      for (const word of para.split(/ +/)) {
        const next = line ? `${line} ${word}` : word;
        if (f.widthOfTextAtSize(next, size) <= width) {
          line = next;
          continue;
        }
        if (line) out.push(line);
        // Break a word that is wider than the column on its own.
        let rest = word;
        while (f.widthOfTextAtSize(rest, size) > width && rest.length > 1) {
          let cut = rest.length - 1;
          while (
            cut > 1 &&
            f.widthOfTextAtSize(rest.slice(0, cut), size) > width
          )
            cut--;
          out.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
      out.push(line);
    }
    return out;
  };
  const cur = invoice.currency;
  const factor = 10 ** minorDigits(cur);
  const amount = (minor: number) => clean(money(minor, cur));
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const text = (
    value: string,
    x: number,
    at: number,
    size = 10,
    f: Font = font,
    color = ink,
    align: 'left' | 'right' = 'left',
  ) => {
    const v = clean(value);
    const dx = align === 'right' ? f.widthOfTextAtSize(v, size) : 0;
    page.drawText(v, { x: x - dx, y: at, size, font: f, color });
  };

  // Title and number on the left, the business ("from") block on the right.
  text('INVOICE', M, y - 22, 26, bold);
  text(invoice.number, M, y - 42, 12, font, muted);
  if (invoice.paid) text('PAID', M, y - 60, 11, bold, green);
  const fromLines = wrap(invoice.from || 'Your business name', font, 10, 220);
  fromLines.forEach((line, i) =>
    text(
      line,
      right,
      y - 12 - i * 14,
      10,
      i ? font : bold,
      i ? muted : ink,
      'right',
    ),
  );
  y -= Math.max(84, 26 + fromLines.length * 14);

  // Bill to, and the invoice facts.
  text('BILL TO', M, y, 8, bold, muted);
  const billLines = [
    ...wrap(invoice.client || '-', bold, 11, 250),
    ...(invoice.address ? wrap(invoice.address, font, 10, 250) : []),
  ];
  const clientLines = wrap(invoice.client || '-', bold, 11, 250).length;
  billLines.forEach((line, i) =>
    text(
      line,
      M,
      y - 16 - i * 14,
      i < clientLines ? 11 : 10,
      i < clientLines ? bold : font,
      i < clientLines ? ink : muted,
    ),
  );
  const facts: [string, string][] = [
    ['Invoice number', invoice.number],
    ['Issue date', invoice.date],
    ['Due date', invoice.due],
    ['Currency', cur],
  ];
  facts.forEach(([k, v], i) => {
    text(k, right - 130, y - 16 - i * 15, 9, font, muted, 'right');
    text(v, right, y - 16 - i * 15, 10, bold, ink, 'right');
  });
  y -= Math.max(billLines.length * 14, facts.length * 15) + 46;

  // Line items.
  const colQty = right - 200;
  const colRate = right - 105;
  const descWidth = colQty - 70 - M;
  const tableHead = () => {
    page.drawRectangle({
      x: M,
      y: y - 8,
      width: right - M,
      height: 24,
      color: band,
    });
    text('DESCRIPTION', M + 8, y, 8, bold, muted);
    text('QTY / TIME', colQty, y, 8, bold, muted, 'right');
    text('RATE', colRate, y, 8, bold, muted, 'right');
    text('AMOUNT', right - 8, y, 8, bold, muted, 'right');
    y -= 30;
  };
  const newPage = () => {
    page = pdf.addPage([W, H]);
    y = H - M;
    text(`${invoice.number} (continued)`, M, y, 9, font, muted);
    y -= 30;
  };
  tableHead();
  if (!invoice.lines.length) {
    text('No line items', M + 8, y, 10, font, muted);
    y -= 26;
  }
  for (const line of invoice.lines) {
    const desc = wrap(line.description || '-', font, 10, descWidth);
    const sub = line.manual
      ? ''
      : `${line.project ? `${line.project} · ` : ''}${line.date}`;
    const height = desc.length * 13 + (sub ? 12 : 0);
    if (y - height < M + 40) {
      newPage();
      tableHead();
    }
    desc.forEach((d, i) => text(d, M + 8, y - i * 13, 10));
    if (sub) text(sub, M + 8, y - desc.length * 13, 8, font, muted);
    text(lineQuantityText(line), colQty, y, 10, font, ink, 'right');
    text(
      amount(Math.round(line.rate * factor)),
      colRate,
      y,
      10,
      font,
      ink,
      'right',
    );
    text(amount(lineAmount(line, cur)), right - 8, y, 10, bold, ink, 'right');
    y -= height + 2;
    page.drawLine({
      start: { x: M, y },
      end: { x: right, y },
      thickness: 0.6,
      color: rule,
    });
    y -= 18;
  }

  // Totals, right aligned.
  const t = invoiceTotals(invoice);
  const rows: [string, string][] = [['Subtotal', amount(t.subtotal)]];
  if (t.discount) rows.push(['Discount', `-${amount(t.discount)}`]);
  rows.push([`Tax (${invoice.tax}%)`, amount(t.tax)]);
  if (y - (rows.length * 16 + 40) < M) newPage();
  y -= 4;
  for (const [k, v] of rows) {
    text(k, right - 200, y, 10, font, muted);
    text(v, right - 8, y, 10, font, ink, 'right');
    y -= 16;
  }
  page.drawLine({
    start: { x: right - 200, y: y + 6 },
    end: { x: right, y: y + 6 },
    thickness: 1.2,
    color: ink,
  });
  y -= 14;
  text('Total', right - 200, y, 13, bold);
  text(amount(t.total), right - 8, y, 13, bold, ink, 'right');
  y -= 40;

  // Notes / payment instructions.
  if (invoice.notes.trim()) {
    if (y - 30 < M) newPage();
    text('NOTES', M, y, 8, bold, muted);
    y -= 16;
    for (const line of wrap(invoice.notes, font, 10, right - M)) {
      if (y < M) newPage();
      text(line, M, y, 10, font, muted);
      y -= 14;
    }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const label = clean(`${invoice.number} · Page ${i + 1} of ${pages.length}`);
    p.drawText(label, {
      x: W - M - font.widthOfTextAtSize(label, 8),
      y: 26,
      size: 8,
      font,
      color: muted,
    });
  });
  return pdf.save();
}

// ---- Ranges, grouping and reports (view helpers; storage format unchanged) ----

export type TimeRange = 'week' | 'lastweek' | 'month' | 'lastmonth' | 'all';
export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'This week' },
  { value: 'lastweek', label: 'Last week' },
  { value: 'month', label: 'This month' },
  { value: 'lastmonth', label: 'Last month' },
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Parse YYYY-MM-DD as a local calendar date (Date.parse would use UTC). */
export const parseDay = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Inclusive YYYY-MM-DD bounds for a range; weeks start on Monday. */
export function rangeBounds(
  range: TimeRange,
  today = new Date(),
): { start: string; end: string } | null {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (range === 'week' || range === 'lastweek') {
    const start = new Date(base);
    start.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    if (range === 'lastweek') start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: ymd(start), end: ymd(end) };
  }
  if (range === 'month' || range === 'lastmonth') {
    const offset = range === 'lastmonth' ? -1 : 0;
    const start = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    const end = new Date(base.getFullYear(), base.getMonth() + offset + 1, 0);
    return { start: ymd(start), end: ymd(end) };
  }
  return null;
}

export function inRange(date: string, bounds: { start: string; end: string } | null) {
  return !bounds || (date >= bounds.start && date <= bounds.end);
}

export function rangeCaption(bounds: { start: string; end: string } | null) {
  if (!bounds) return 'Every entry';
  const a = parseDay(bounds.start);
  const b = parseDay(bounds.end);
  const short = { month: 'short', day: 'numeric' } as const;
  return `${a.toLocaleDateString(undefined, short)} – ${b.toLocaleDateString(undefined, { ...short, year: 'numeric' })}`;
}

/** "Today", "Yesterday", or a weekday date heading for a YYYY-MM-DD day. */
export function dayLabel(date: string, today = new Date()) {
  const todayKey = ymd(today);
  const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date === todayKey) return 'Today';
  if (date === ymd(y)) return 'Yesterday';
  const d = parseDay(date);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

/** Billable amount in minor units (0 for non-billable work). */
export function entryAmount(entry: TimeEntry, currency: string) {
  return entry.billable ? lineAmount(entry, currency) : 0;
}

/** Compact h:mm, e.g. 2:05 — for totals where seconds are noise. */
export function hoursMinutes(seconds: number) {
  const m = Math.round(Math.max(0, seconds) / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export interface DayGroup {
  date: string;
  entries: TimeEntry[];
  seconds: number;
  amount: number;
}
/** Group entries by day, newest day first; order inside a day is preserved. */
export function groupByDay(entries: TimeEntry[], currency: string): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const entry of entries) {
    let group = map.get(entry.date);
    if (!group) {
      group = { date: entry.date, entries: [], seconds: 0, amount: 0 };
      map.set(entry.date, group);
    }
    group.entries.push(entry);
    group.seconds += entry.seconds;
    group.amount += entryAmount(entry, currency);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export interface ReportRow {
  key: string;
  label: string;
  detail: string;
  seconds: number;
  billableSeconds: number;
  amount: number;
}
/** Totals per client or per client+project, largest first. */
export function summarize(
  entries: TimeEntry[],
  by: 'client' | 'project',
  currency: string,
): ReportRow[] {
  const map = new Map<string, ReportRow>();
  for (const e of entries) {
    const client = e.client.trim() || 'No client';
    const project = e.project.trim();
    const key =
      by === 'client'
        ? client.toLowerCase()
        : `${client.toLowerCase()}\u0000${project.toLowerCase()}`;
    let row = map.get(key);
    if (!row) {
      row = {
        key,
        label: by === 'client' ? client : project || 'No project',
        detail: by === 'client' ? '' : client,
        seconds: 0,
        billableSeconds: 0,
        amount: 0,
      };
      map.set(key, row);
    }
    row.seconds += e.seconds;
    if (e.billable) row.billableSeconds += e.seconds;
    row.amount += entryAmount(e, currency);
  }
  return [...map.values()].sort(
    (a, b) => b.seconds - a.seconds || a.label.localeCompare(b.label),
  );
}

/** Most recent rate used for a client (matched case-insensitively). */
export function lastRateFor(entries: TimeEntry[], client: string) {
  const name = client.trim().toLowerCase();
  if (!name) return null;
  let best: TimeEntry | null = null;
  for (const e of entries)
    if (e.client.trim().toLowerCase() === name && (!best || e.date >= best.date))
      best = e;
  return best ? best.rate : null;
}
