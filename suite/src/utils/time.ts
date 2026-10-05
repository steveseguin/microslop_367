export interface TimeEntry {
  id: string;
  description: string;
  client: string;
  project: string;
  date: string;
  seconds: number;
  rate: number;
  billable: boolean;
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
export function lineAmount(entry: TimeEntry, currency: string) {
  return Math.round(
    (entry.seconds / 3600) * entry.rate * 10 ** minorDigits(currency),
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

export function validTimeBackup(value: unknown): value is TimeWorkspace {
  const obj = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object';
  const text = (v: unknown): v is string =>
    typeof v === 'string' && v.length <= 100_000;
  const num = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
  const date = (v: unknown) =>
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v));
  const base = (v: Record<string, unknown>) =>
    text(v.id) &&
    text(v.description) &&
    text(v.client) &&
    text(v.project) &&
    date(v.date) &&
    num(v.rate, 1_000_000) &&
    typeof v.billable === 'boolean';
  const entry = (v: unknown) =>
    obj(v) && base(v) && num(v.seconds, 315_360_000);
  if (
    !obj(value) ||
    value.version !== 1 ||
    !text(value.business) ||
    !CURRENCIES.includes(String(value.currency)) ||
    !num(value.nextInvoice, 1e9) ||
    !Number.isInteger(value.nextInvoice) ||
    Number(value.nextInvoice) < 1
  )
    return false;
  if (
    !Array.isArray(value.entries) ||
    !value.entries.every(entry) ||
    new Set(value.entries.map((e) => e.id)).size !== value.entries.length
  )
    return false;
  if (
    value.timer !== null &&
    !(
      obj(value.timer) &&
      base(value.timer) &&
      num(value.timer.started, Date.now())
    )
  )
    return false;
  if (
    !Array.isArray(value.invoices) ||
    !value.invoices.every(
      (v) =>
        obj(v) &&
        ['id', 'number', 'client', 'from', 'address', 'notes'].every((k) =>
          text(v[k]),
        ) &&
        date(v.date) &&
        date(v.due) &&
        CURRENCIES.includes(String(v.currency)) &&
        num(v.tax, 100) &&
        num(v.discount, 1e12) &&
        typeof v.paid === 'boolean' &&
        Array.isArray(v.lines) &&
        v.lines.length > 0 &&
        v.lines.every(entry),
    )
  )
    return false;
  return (
    new Set(value.invoices.map((i) => i.id)).size === value.invoices.length
  );
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
