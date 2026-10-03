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
