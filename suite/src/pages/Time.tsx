import { useEffect, useId, useRef, useState } from 'react';
import type { InputHTMLAttributes, ReactElement, ReactNode } from 'react';
import {
  Play,
  Square,
  Plus,
  Download,
  FileText,
  Trash2,
  Pencil,
  Upload,
  Copy,
  Printer,
  Save,
  FileDown,
  FileUp,
  X,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import { DictateField } from '../components/Dictate';
import { appendSpoken, spokenNumber } from '../utils/speech';
import {
  csvCell,
  downloadFile,
  exportJSON,
  localDate,
  useToolStorage,
} from '../utils/toolStorage';
import {
  CURRENCIES,
  dayLabel,
  detachedLines,
  duration,
  EMPTY_TIME,
  entryAmount,
  groupByDay,
  hoursMinutes,
  inRange,
  invoiceFile,
  invoicePdf,
  invoiceStatus,
  invoiceTotals,
  lastRateFor,
  lineAmount,
  lineQuantity,
  lineQuantityText,
  manualLine,
  manualSeconds,
  minorDigits,
  money,
  rangeBounds,
  parseDay,
  rangeCaption,
  summarize,
  TIME_RANGES,
  uniqueNumber,
  validInvoiceFile,
  validTimeBackup,
} from '../utils/time';
import type {
  Invoice,
  ReportRow,
  TimeEntry,
  TimeRange,
} from '../utils/time';
import '../styles/time.css';

function InvoicePaper({ invoice }: { invoice: Invoice }) {
  const total = invoiceTotals(invoice);
  return (
    <article className="invoice-paper" aria-label="Invoice preview">
      <div className="invoice-top">
        <div>
          <h2>INVOICE</h2>
          <p>
            {invoice.number}
            {invoice.paid ? ' · PAID' : ''}
          </p>
        </div>
        <p>{invoice.from || 'Your business name'}</p>
      </div>
      <div className="invoice-top">
        <div>
          <strong>Bill to</strong>
          <p>
            {invoice.client}
            <br />
            {invoice.address}
          </p>
        </div>
        <p>
          Issued: {invoice.date}
          <br />
          Due: {invoice.due}
          <br />
          Currency: {invoice.currency}
        </p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty / time</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {!invoice.lines.length && (
            <tr>
              <td colSpan={4}>No line items yet.</td>
            </tr>
          )}
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.description}
                {!line.manual && (
                  <>
                    <br />
                    <small>
                      {line.project ? `${line.project} · ` : ''}
                      {line.date}
                    </small>
                  </>
                )}
              </td>
              <td>{lineQuantityText(line)}</td>
              <td>
                {money(
                  Math.round(line.rate * 10 ** minorDigits(invoice.currency)),
                  invoice.currency,
                )}
              </td>
              <td>
                {money(lineAmount(line, invoice.currency), invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice-totals">
        <p>
          <span>Subtotal</span>
          <span>{money(total.subtotal, invoice.currency)}</span>
        </p>
        <p>
          <span>Discount</span>
          <span>−{money(total.discount, invoice.currency)}</span>
        </p>
        <p>
          <span>Tax ({invoice.tax}%)</span>
          <span>{money(total.tax, invoice.currency)}</span>
        </p>
        <p className="invoice-total">
          <strong>Total</strong>
          <strong>{money(total.total, invoice.currency)}</strong>
        </p>
      </div>
      {invoice.notes && <p>{invoice.notes}</p>}
    </article>
  );
}

/**
 * A labelled field. The label points at the control with htmlFor, so the mic
 * button that DictateField tucks inside the field never becomes part of the
 * field's accessible name.
 */
function Field({
  id,
  label,
  speech,
  multiline,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  /** `name` is spoken as "Dictate <name>"; keep it distinct from the label. */
  speech?: { name: string; onText: (text: string) => void; long?: boolean };
  multiline?: boolean;
  className?: string;
  children: ReactElement;
}) {
  return (
    <div className={`time-field${className ? ` ${className}` : ''}`}>
      <label htmlFor={id}>{label}</label>
      {speech ? (
        <DictateField
          label={speech.name}
          onText={speech.onText}
          multiline={multiline}
          continuous={speech.long}
        >
          {children}
        </DictateField>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * Number input that lets the field be cleared or half-typed ("1.") while only
 * committing valid values, and follows outside changes (e.g. dictation).
 */
function NumberInput({
  value,
  onValue,
  min = 0,
  max,
  ...rest
}: {
  value: number;
  onValue: (value: number) => void;
  min?: number;
  max: number;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'min' | 'max' | 'type'
>) {
  const [draft, setDraft] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (Number(draft) !== value || draft.trim() === '') setDraft(String(value));
  }
  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        const v = Number(e.target.value);
        if (
          e.target.value.trim() !== '' &&
          Number.isFinite(v) &&
          v >= min &&
          v <= max
        )
          onValue(v);
      }}
      onBlur={() => {
        if (draft.trim() === '' || Number(draft) !== value)
          setDraft(String(value));
      }}
    />
  );
}

const STATUS_CLASS = {
  Paid: 'time-status--invoiced',
  Unpaid: 'time-status--open',
  Overdue: 'time-status--overdue',
} as const;

const clock = (time: number) =>
  new Date(time).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

const longDate = (date: string) =>
  parseDay(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const shortDate = (date: string) =>
  parseDay(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

function ReportTable({
  title,
  column,
  rows,
  currency,
}: {
  title: string;
  column: string;
  rows: ReportRow[];
  currency: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.seconds));
  const seconds = rows.reduce((sum, r) => sum + r.seconds, 0);
  const amount = rows.reduce((sum, r) => sum + r.amount, 0);
  return (
    <section className="tool-panel time-report">
      <h2>{title}</h2>
      <table className="time-report-table">
        <thead>
          <tr>
            <th scope="col">{column}</th>
            <th scope="col">Hours</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <span className="time-report-name">
                  {row.label}
                  {row.detail && <small>{row.detail}</small>}
                </span>
                <span
                  className="time-bar"
                  aria-hidden="true"
                  style={{ width: `${(row.seconds / max) * 100}%` }}
                >
                  <span
                    className="time-bar__billable"
                    style={{
                      width: `${row.seconds ? (row.billableSeconds / row.seconds) * 100 : 0}%`,
                    }}
                  />
                </span>
              </td>
              <td>{(row.seconds / 3600).toFixed(2)}</td>
              <td>{money(row.amount, currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{(seconds / 3600).toFixed(2)}</td>
            <td>{money(amount, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

export default function Time(props: ToolProps) {
  const store = useToolStorage('time', EMPTY_TIME);
  const { data, update } = store;
  const [tab, setTab] = useState<'time' | 'invoices' | 'reports'>('time');
  const [range, setRange] = useState<TimeRange>('all');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [rate, setRate] = useState('75');
  // Once the user types a rate we never overwrite it with a client default.
  const [rateTouched, setRateTouched] = useState(false);
  const [billable, setBillable] = useState(true);
  const [hours, setHours] = useState('1');
  const [date, setDate] = useState(localDate());
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const [undo, setUndo] = useState<TimeEntry | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const invoiceImportRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLElement>(null);
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  // When this invoice was last confirmed written to on-device storage.
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  useEffect(() => {
    if (!data.timer) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [data.timer]);
  const invoice =
    data.invoices.find((item) => item.id === invoiceId) ?? data.invoices[0];
  const billed = new Set(
    data.invoices.flatMap((item) => item.lines.map((line) => line.id)),
  );
  const today = localDate();
  const bounds = rangeBounds(range);
  const rangeLabel =
    TIME_RANGES.find((r) => r.value === range)?.label ?? 'All time';
  const currency = data.currency;
  // Newest entries first, both across days and within a day.
  const inPeriod = [...data.entries]
    .reverse()
    .filter((entry) => inRange(entry.date, bounds))
    .sort((a, b) => b.date.localeCompare(a.date));
  const visible = inPeriod.filter((entry) =>
    `${entry.description} ${entry.project} ${entry.client} ${entry.date}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  const days = groupByDay(visible, currency);
  const unbilled = data.entries.filter((e) => e.billable && !billed.has(e.id));
  const sumSeconds = (list: TimeEntry[]) =>
    list.reduce((sum, e) => sum + e.seconds, 0);
  const periodSeconds = sumSeconds(inPeriod);
  const todaySeconds =
    sumSeconds(data.entries.filter((e) => e.date === today)) +
    (data.timer ? Math.max(0, (now - data.timer.started) / 1000) : 0);
  const periodBillable = sumSeconds(inPeriod.filter((e) => e.billable));
  const periodAmount = inPeriod.reduce(
    (sum, e) => sum + entryAmount(e, currency),
    0,
  );
  const periodUnbilled = inPeriod.filter(
    (e) => e.billable && !billed.has(e.id),
  );
  const unpaid = data.invoices.filter((i) => !i.paid);
  const outstanding = unpaid
    .filter((i) => i.currency === currency)
    .reduce((sum, i) => sum + invoiceTotals(i).total, 0);
  const clients = [...new Set(data.entries.map((e) => e.client))];
  const projects = [
    ...new Set(
      data.entries
        .filter(
          (e) =>
            e.project &&
            (!client.trim() ||
              e.client.trim().toLowerCase() === client.trim().toLowerCase()),
        )
        .map((e) => e.project),
    ),
  ];
  const byClient = summarize(inPeriod, 'client', currency);
  const byProject = summarize(inPeriod, 'project', currency);
  const resetForm = () => {
    setDescription('');
    setEditing(null);
    setRateTouched(false);
  };
  const chooseClient = (value: string) => {
    setClient(value);
    if (rateTouched) return;
    const last = lastRateFor(data.entries, value);
    if (last !== null) setRate(String(last));
  };
  const draftEntry = (): TimeEntry | null => {
    if (
      !description.trim() ||
      !client.trim() ||
      !Number.isFinite(Number(rate)) ||
      Number(rate) < 0 ||
      Number(rate) > 1e6 ||
      !date
    ) {
      setMessage(
        'Enter a description, client, date, and a valid non-negative hourly rate.',
      );
      return null;
    }
    return {
      id: editing ?? crypto.randomUUID(),
      description: description.trim(),
      client: client.trim(),
      project: project.trim(),
      rate: Number(rate),
      billable,
      date,
      seconds: 0,
    };
  };
  const addManual = async () => {
    const entry = draftEntry();
    if (!entry) return;
    if (!(Number(hours) > 0 && Number(hours) <= 87600)) {
      setMessage('Enter hours greater than zero (up to 87,600).');
      return;
    }
    entry.seconds = Math.max(1, Math.round(Number(hours) * 3600));
    if (
      await update((s) => ({
        ...s,
        entries: editing
          ? s.entries.map((e) => (e.id === editing ? entry : e))
          : [...s.entries, entry],
      }))
    ) {
      resetForm();
      setMessage('Time entry saved.');
    }
  };
  const beginTimer = async (entry: TimeEntry) => {
    if (data.timer) return;
    const started = Date.now();
    setNow(started);
    if (
      await update((s) => ({
        ...s,
        timer: { ...entry, date: localDate(), started },
      }))
    ) {
      setRateTouched(false);
      setMessage('Timer running. It keeps time even when this tab is closed.');
    }
  };
  const start = async () => {
    const entry = draftEntry();
    if (entry) await beginTimer(entry);
  };
  const resume = async (source: TimeEntry) => {
    // Prefill the form too, so it shows what is being tracked.
    setEditing(null);
    setDescription(source.description);
    setClient(source.client);
    setProject(source.project);
    setRate(String(source.rate));
    setBillable(source.billable);
    await beginTimer({
      id: crypto.randomUUID(),
      description: source.description,
      client: source.client,
      project: source.project,
      rate: source.rate,
      billable: source.billable,
      date: localDate(),
      seconds: 0,
    });
  };
  const exportReport = () => {
    const rows: (string | number)[][] = [
      ['Group', 'Client', 'Project', 'Hours', 'Billable hours', `Amount (${currency})`],
    ];
    const digits = minorDigits(currency);
    for (const [group, list] of [
      ['Client', byClient],
      ['Project', byProject],
    ] as const)
      for (const r of list)
        rows.push([
          group,
          group === 'Client' ? r.label : r.detail,
          group === 'Project' ? r.label : '',
          (r.seconds / 3600).toFixed(2),
          (r.billableSeconds / 3600).toFixed(2),
          (r.amount / 10 ** digits).toFixed(digits),
        ]);
    downloadFile(
      `ninjatime-report-${range}.csv`,
      '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n'),
      'text/csv;charset=utf-8',
    );
  };
  const stop = async () => {
    if (!data.timer) return;
    const timer = data.timer;
    const entry: TimeEntry = {
      id: timer.id,
      description: timer.description,
      client: timer.client,
      project: timer.project,
      date: timer.date,
      rate: timer.rate,
      billable: timer.billable,
      seconds: Math.max(1, Math.round((Date.now() - timer.started) / 1000)),
    };
    if (
      await update((s) => ({
        ...s,
        timer: null,
        entries: [...s.entries, entry],
      }))
    ) {
      setDescription('');
      setMessage('Timer stopped and saved.');
    }
  };
  const createInvoice = async () => {
    const lines = unbilled.filter((e) => selected.includes(e.id));
    if (!lines.length) {
      setMessage('Select unbilled entries to invoice.');
      return;
    }
    if (new Set(lines.map((e) => e.client)).size !== 1) {
      setMessage('Select entries for one client per invoice.');
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      number: `INV-${String(data.nextInvoice).padStart(4, '0')}`,
      date: localDate(),
      due: localDate(due),
      client: lines[0].client,
      from: data.business,
      address: '',
      notes: 'Thank you for your business.',
      currency: data.currency,
      tax: 0,
      discount: 0,
      paid: false,
      lines,
    };
    if (
      await update((s) => ({
        ...s,
        invoices: [newInvoice, ...s.invoices],
        nextInvoice: s.nextInvoice + 1,
      }))
    ) {
      setInvoiceId(newInvoice.id);
      setSavedAt(Date.now());
      setSelected([]);
      setTab('invoices');
      setMessage('Invoice created. Review the details before exporting.');
    }
  };
  const changeInvoice = (change: (item: Invoice) => Invoice) => {
    if (!invoice) return;
    const id = invoice.id;
    void update((s) => ({
      ...s,
      invoices: s.invoices.map((item) => (item.id === id ? change(item) : item)),
    })).then((ok) => {
      if (ok) setSavedAt(Date.now());
    });
  };
  const patchInvoice = (patch: Partial<Invoice>) =>
    changeInvoice((item) => ({ ...item, ...patch }));
  const patchLine = (lineId: string, patch: Partial<TimeEntry>) =>
    changeInvoice((item) => ({
      ...item,
      lines: item.lines.map((line) => {
        if (line.id !== lineId) return line;
        const next = { ...line, ...patch };
        if (next.manual && typeof next.quantity === 'number')
          next.seconds = manualSeconds(next.quantity);
        return next;
      }),
    }));
  const openInvoice = (id: string) => {
    setInvoiceId(id);
    setSavedAt(null);
  };
  const dueIn30 = () => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    return localDate(due);
  };
  const addInvoice = async (
    make: (number: string) => Invoice,
    note: string,
  ) => {
    let created: Invoice | null = null;
    const ok = await update((s) => {
      created = make(`INV-${String(s.nextInvoice).padStart(4, '0')}`);
      return {
        ...s,
        invoices: [created, ...s.invoices],
        nextInvoice: s.nextInvoice + 1,
      };
    });
    if (ok && created) {
      setInvoiceId((created as Invoice).id);
      setSavedAt(Date.now());
      setTab('invoices');
      setMessage(note);
      requestAnimationFrame(() =>
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  };
  const newInvoice = () =>
    addInvoice((number) => {
      const draft: Invoice = {
        id: crypto.randomUUID(),
        number,
        date: localDate(),
        due: dueIn30(),
        client: '',
        from: data.business,
        address: '',
        notes: 'Thank you for your business.',
        currency: data.currency,
        tax: 0,
        discount: 0,
        paid: false,
        lines: [],
      };
      draft.lines = [manualLine(draft)];
      return draft;
    }, 'New invoice created. Add the client and line items.');
  const duplicateInvoice = () => {
    if (!invoice) return;
    const source = invoice;
    void addInvoice(
      (number) => ({
        ...source,
        id: crypto.randomUUID(),
        number,
        date: localDate(),
        due: dueIn30(),
        paid: false,
        // Copies never claim the original's time entries.
        lines: detachedLines(source.lines),
      }),
      `Copied ${source.number}. The copy's lines are editable and not linked to time entries.`,
    );
  };
  const saveInvoice = async () => {
    // Autosave already ran; this writes the current state again and confirms.
    if (await update((s) => ({ ...s }))) {
      setSavedAt(Date.now());
      setMessage(`${invoice?.number ?? 'Invoice'} saved on this device.`);
    }
  };
  const fileBase = (inv: Invoice) =>
    (inv.number.trim() || 'invoice').replace(/[^\w.-]+/g, '-');
  const downloadPdf = async () => {
    if (!invoice) return;
    setPdfBusy(true);
    try {
      const bytes = await invoicePdf(invoice);
      downloadFile(
        `${fileBase(invoice)}.pdf`,
        bytes as Uint8Array<ArrayBuffer>,
        'application/pdf',
      );
      setMessage(`${invoice.number}.pdf downloaded.`);
    } catch {
      setMessage('The PDF could not be created. Try Print / Save PDF instead.');
    } finally {
      setPdfBusy(false);
    }
  };
  const importInvoice = async (file: File) => {
    try {
      if (file.size > 5_000_000) throw new Error('size');
      const parsed: unknown = JSON.parse(await file.text());
      if (!validInvoiceFile(parsed)) throw new Error('shape');
      const source = parsed.invoice;
      let created: Invoice | null = null;
      const ok = await update((s) => {
        created = {
          ...source,
          id: crypto.randomUUID(),
          number: uniqueNumber(
            source.number,
            s.invoices.map((i) => i.number),
          ),
          // Imported lines are snapshots; they never link to time entries here.
          lines: detachedLines(source.lines),
        };
        return { ...s, invoices: [created, ...s.invoices] };
      });
      if (ok && created) {
        const added: Invoice = created;
        setInvoiceId(added.id);
        setSavedAt(Date.now());
        setMessage(`Imported ${added.number} (${added.lines.length} line${added.lines.length === 1 ? '' : 's'}).`);
      } else if (!ok) {
        setMessage('The invoice could not be saved. Nothing was imported.');
      }
    } catch {
      setMessage(
        'That file is not a NinjaTime invoice (.invoice.json). Nothing was imported.',
      );
    }
  };
  const exportCSV = () => {
    const rows = [
      [
        'Date',
        'Client',
        'Project',
        'Description',
        'Hours',
        'Hourly rate',
        'Billable',
        'Invoiced',
      ],
      ...visible.map((e) => [
        e.date,
        e.client,
        e.project,
        e.description,
        (e.seconds / 3600).toFixed(4),
        e.rate,
        e.billable ? 'Yes' : 'No',
        billed.has(e.id) ? 'Yes' : 'No',
      ]),
    ];
    downloadFile(
      'ninjatime.csv',
      '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n'),
      'text/csv;charset=utf-8',
    );
  };
  return (
    <ToolShell
      {...props}
      name="NinjaTime"
      subtitle="Track your work. Turn billable hours into polished invoices."
      status={store.status}
      error={store.error}
      print={invoice ? <InvoicePaper invoice={invoice} /> : undefined}
    >
      <div className="tool-tabbar">
        <div className="tool-tabs" role="tablist" aria-label="Time workspace">
          <button
            role="tab"
            aria-selected={tab === 'time'}
            onClick={() => setTab('time')}
          >
            Time entries
          </button>
          <button
            role="tab"
            aria-selected={tab === 'invoices'}
            onClick={() => setTab('invoices')}
          >
            Invoices ({data.invoices.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === 'reports'}
            onClick={() => setTab('reports')}
          >
            Reports
          </button>
        </div>
        <div className="tool-row">
          <button
            className="btn btn-secondary"
            onClick={() => exportJSON('ninjatime-backup.json', data)}
          >
            <Download size={15} /> Backup
          </button>
          <button
            className="btn btn-secondary"
            disabled={!store.ready}
            onClick={() => importRef.current?.click()}
          >
            <Upload size={15} /> Restore backup
          </button>
          <input
            hidden
            ref={importRef}
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                if (file.size > 20_000_000) throw new Error();
                const parsed: unknown = JSON.parse(await file.text());
                if (!validTimeBackup(parsed)) throw new Error();
                if (
                  !window.confirm(
                    'Replace this time workspace with the backup? Export a backup first if you need the current entries.',
                  )
                )
                  return;
                if (await update(() => parsed)) {
                  setSelected([]);
                  setInvoiceId(null);
                  setEditing(null);
                  setUndo(null);
                  setMessage('Backup restored.');
                }
              } catch {
                setMessage(
                  'That file is not a valid NinjaTime backup. Nothing was replaced.',
                );
              }
            }}
          />
        </div>
      </div>
      {message && (
        <div className="tool-alert" role="status">
          {message}
        </div>
      )}
      {(tab === 'time' || tab === 'reports') && (
        <div className="time-rangebar">
          <label className="time-range">
            <span>Date range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as TimeRange)}
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <span className="tool-muted time-range__caption">
            {rangeCaption(bounds)}
          </span>
          {tab === 'reports' && (
            <button
              className="btn btn-secondary time-rangebar__action"
              disabled={!inPeriod.length}
              onClick={exportReport}
            >
              <Download size={15} /> Export report CSV
            </button>
          )}
        </div>
      )}
      {(tab === 'time' || tab === 'reports') && (
        <div className="tool-metrics time-metrics">
          <div className="tool-metric">
            <span>Today</span>
            <strong>{hoursMinutes(todaySeconds)} h</strong>
            <small>{data.timer ? 'Including running timer' : ' '}</small>
          </div>
          <div className="tool-metric">
            <span>Tracked · {rangeLabel}</span>
            <strong>{hoursMinutes(periodSeconds)} h</strong>
            <small>
              {periodSeconds
                ? `${Math.round((periodBillable / periodSeconds) * 100)}% billable`
                : 'No time yet'}
            </small>
          </div>
          <div className="tool-metric">
            <span>Billable · {rangeLabel}</span>
            <strong>{money(periodAmount, currency)}</strong>
            <small>
              {(sumSeconds(periodUnbilled) / 3600).toFixed(2)} h not invoiced
            </small>
          </div>
          <div className="tool-metric">
            <span>Unpaid invoices</span>
            <strong>{unpaid.length}</strong>
            <small>
              {unpaid.length ? `${money(outstanding, currency)} due` : 'All paid up'}
            </small>
          </div>
        </div>
      )}
      {tab === 'time' && (
        <div className="tool-stack">
          <section className="tool-panel time-entry-panel" ref={formRef}>
            <h2>{editing ? 'Edit time entry' : 'What are you working on?'}</h2>
            <fieldset
              className="tool-fieldset"
              disabled={!store.ready || !!data.timer}
            >
              <div className="tool-fields tool-fields--entry">
                <Field
                  id={fid('description')}
                  label="Description"
                  speech={{
                    name: 'description',
                    onText: (t) => setDescription((d) => appendSpoken(d, t)),
                  }}
                >
                  <input
                    id={fid('description')}
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || e.nativeEvent.isComposing)
                        return;
                      e.preventDefault();
                      void (editing ? addManual() : start());
                    }}
                    enterKeyHint={editing ? 'done' : 'go'}
                    placeholder="Website design"
                  />
                </Field>
                <Field
                  id={fid('client')}
                  label="Client"
                  speech={{
                    name: 'client',
                    onText: (t) => chooseClient(t),
                  }}
                >
                  <input
                    id={fid('client')}
                    value={client}
                    onChange={(e) => chooseClient(e.target.value)}
                    list="time-clients"
                    placeholder="Client name"
                  />
                </Field>
                <Field
                  id={fid('project')}
                  label="Project"
                  speech={{
                    name: 'project',
                    onText: (t) => setProject(t),
                  }}
                >
                  <input
                    id={fid('project')}
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    list="time-projects"
                    placeholder="Optional"
                  />
                </Field>
                <Field
                  id={fid('rate')}
                  label="Hourly rate"
                  speech={{
                    name: 'rate',
                    onText: (t) => {
                      const n = spokenNumber(t);
                      if (n && Number(n) >= 0) {
                        setRate(n);
                        setRateTouched(true);
                      }
                    },
                  }}
                >
                  <input
                    id={fid('rate')}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value);
                      setRateTouched(true);
                    }}
                  />
                </Field>
              </div>
              <datalist id="time-clients">
                {clients.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </datalist>
              <datalist id="time-projects">
                {projects.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </datalist>
              <label className="tool-check">
                <input
                  type="checkbox"
                  checked={billable}
                  onChange={(e) => setBillable(e.target.checked)}
                />
                Billable
              </label>
            </fieldset>
            {!editing && (
              <div
                className={`tool-timer-bar${data.timer ? ' time-timer--running' : ''}`}
              >
                <strong className="tool-timer" aria-label="Elapsed time">
                  {duration(data.timer ? (now - data.timer.started) / 1000 : 0)}
                </strong>
                <span className="tool-muted tool-timer-label">
                  {data.timer
                    ? `${data.timer.description} · ${data.timer.client}${data.timer.project ? ` · ${data.timer.project}` : ''}`
                    : 'Press Enter in Description to start'}
                </span>
                <button
                  className={`btn ${data.timer ? 'btn-danger' : 'btn-primary'}`}
                  disabled={!store.ready}
                  onClick={() => void (data.timer ? stop() : start())}
                >
                  {data.timer ? <Square size={16} /> : <Play size={16} />}
                  {data.timer ? 'Stop timer' : 'Start timer'}
                </button>
              </div>
            )}
            <fieldset
              className="tool-manual"
              disabled={!store.ready || !!data.timer}
            >
              <h3>{editing ? 'Date and hours' : 'Or log time manually'}</h3>
              <div className="tool-manual__row">
                <label>
                  Date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <Field
                  id={fid('hours')}
                  label="Manual hours"
                  speech={{
                    name: 'hours',
                    onText: (t) => {
                      const n = spokenNumber(t);
                      if (n && Number(n) > 0) setHours(n);
                    },
                  }}
                >
                  <input
                    id={fid('hours')}
                    type="number"
                    inputMode="decimal"
                    min="0.0003"
                    max="87600"
                    step="any"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </Field>
                <div className="tool-row">
                  <button
                    className={`btn ${editing ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => void addManual()}
                  >
                    {!editing && <Plus size={16} />}
                    {editing ? 'Save entry' : 'Add manual entry'}
                  </button>
                  {editing && (
                    <button className="btn btn-secondary" onClick={resetForm}>
                      Cancel edit
                    </button>
                  )}
                </div>
              </div>
            </fieldset>
          </section>
          <section className="tool-panel">
            <div className="tool-row tool-row--between tool-panel__head">
              <h2>Time entries</h2>
              <div className="tool-row">
                <input
                  className="tool-search"
                  type="search"
                  aria-label="Search time entries"
                  placeholder="Search client, project, date…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <button className="btn btn-secondary" onClick={exportCSV}>
                  Export CSV
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!store.ready || !selected.length}
                  onClick={() => void createInvoice()}
                >
                  <FileText size={15} />
                  Create invoice ({selected.length})
                </button>
              </div>
            </div>
            {undo && (
              <div className="tool-alert">
                Entry deleted.{' '}
                <button
                  className="btn btn-secondary"
                  disabled={!store.ready}
                  onClick={async () => {
                    if (
                      await update((s) => ({
                        ...s,
                        entries: [...s.entries, undo],
                        deleted: Object.fromEntries(
                          Object.entries(s.deleted ?? {}).filter(([id]) => id !== undo.id),
                        ),
                      }))
                    )
                      setUndo(null);
                  }}
                >
                  Undo delete
                </button>
              </div>
            )}
            {!visible.length ? (
              <div className="tool-empty">
                {!data.entries.length ? (
                  'Start a timer or add your first time entry.'
                ) : !inPeriod.length ? (
                  <>
                    <p>No time entries {rangeLabel.toLowerCase()}.</p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setRange('all')}
                    >
                      Show all time
                    </button>
                  </>
                ) : (
                  'No entries match your search.'
                )}
              </div>
            ) : (
              <div className="tool-table-wrap">
                <table className="tool-table time-entries">
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="time-sr">Select</span>
                      </th>
                      <th scope="col">Work</th>
                      <th scope="col" className="time-num">
                        Duration
                      </th>
                      <th scope="col" className="time-num">
                        Amount
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col">
                        <span className="time-sr">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  {days.map((day) => (
                    <tbody key={day.date}>
                      <tr className="time-day">
                        <th scope="rowgroup" colSpan={6}>
                          <span className="time-day__label">
                            {dayLabel(day.date)}
                            {day.date === today ||
                            dayLabel(day.date) === 'Yesterday' ? (
                              <small>{shortDate(day.date)}</small>
                            ) : null}
                          </span>
                          <span className="time-day__total">
                            {hoursMinutes(day.seconds)} h
                            {day.amount > 0 && (
                              <> · {money(day.amount, currency)}</>
                            )}
                          </span>
                        </th>
                      </tr>
                      {day.entries.map((entry) => {
                        const isBilled = billed.has(entry.id);
                        const status = isBilled
                          ? 'Invoiced'
                          : entry.billable
                            ? 'Unbilled'
                            : 'Non-billable';
                        return (
                          <tr
                            key={entry.id}
                            className={`time-entry${editing === entry.id ? ' time-entry--editing' : ''}`}
                          >
                            <td className="time-entry__select">
                              <input
                                aria-label={`Select ${entry.description}`}
                                type="checkbox"
                                disabled={!entry.billable || isBilled}
                                checked={selected.includes(entry.id)}
                                onChange={(e) =>
                                  setSelected((s) =>
                                    e.target.checked
                                      ? [...s, entry.id]
                                      : s.filter((id) => id !== entry.id),
                                  )
                                }
                              />
                            </td>
                            <td className="time-entry__work">
                              <span className="time-entry__desc">
                                {entry.description}
                              </span>
                              <small>
                                {entry.client}
                                {entry.project ? ` · ${entry.project}` : ''}
                              </small>
                            </td>
                            <td className="time-num time-entry__hours">
                              {duration(entry.seconds)}
                            </td>
                            <td className="time-num time-entry__amount">
                              {entry.billable ? (
                                money(entryAmount(entry, currency), currency)
                              ) : (
                                <span className="tool-muted">—</span>
                              )}
                              <small>
                                {money(
                                  Math.round(
                                    entry.rate * 10 ** minorDigits(currency),
                                  ),
                                  currency,
                                )}
                                /h
                              </small>
                            </td>
                            <td className="time-entry__status">
                              <span
                                className={`time-status time-status--${status.toLowerCase()}`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="time-entry__actions">
                              <div className="time-actions">
                                <button
                                  className="btn btn-secondary btn-icon"
                                  disabled={!!data.timer || !store.ready}
                                  aria-label={`Resume ${entry.description}`}
                                  title="Start a timer for this again"
                                  onClick={() => void resume(entry)}
                                >
                                  <Play size={14} />
                                </button>
                                <button
                                  className="btn btn-secondary btn-icon"
                                  disabled={
                                    isBilled || !!data.timer || !store.ready
                                  }
                                  aria-label={`Edit ${entry.description}`}
                                  title="Edit"
                                  onClick={() => {
                                    setEditing(entry.id);
                                    setDescription(entry.description);
                                    setClient(entry.client);
                                    setProject(entry.project);
                                    setRate(String(entry.rate));
                                    setRateTouched(true);
                                    setBillable(entry.billable);
                                    setDate(entry.date);
                                    setHours(String(entry.seconds / 3600));
                                    formRef.current?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start',
                                    });
                                    descriptionRef.current?.focus({
                                      preventScroll: true,
                                    });
                                  }}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="btn btn-secondary btn-icon"
                                  disabled={isBilled || !store.ready}
                                  aria-label={`Delete ${entry.description}`}
                                  title="Delete"
                                  onClick={async () => {
                                    if (
                                      await update((s) => ({
                                        ...s,
                                        entries: s.entries.filter(
                                          (e) => e.id !== entry.id,
                                        ),
                                        deleted: { ...(s.deleted ?? {}), [entry.id]: Date.now() },
                                      }))
                                    ) {
                                      setUndo(entry);
                                      setSelected((s) =>
                                        s.filter((id) => id !== entry.id),
                                      );
                                      if (editing === entry.id) resetForm();
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  ))}
                </table>
              </div>
            )}
          </section>
        </div>
      )}
      {tab === 'reports' &&
        (inPeriod.length ? (
          <div className="time-report-grid">
            <ReportTable
              title="By client"
              column="Client"
              rows={byClient}
              currency={currency}
            />
            <ReportTable
              title="By project"
              column="Project"
              rows={byProject}
              currency={currency}
            />
            <p className="tool-hint time-report-legend">
              <span className="time-legend-item">
                <span className="time-legend time-legend--billable" />
                Billable
              </span>
              <span className="time-legend-item">
                <span className="time-legend" />
                Non-billable
              </span>
              <span>Amounts in {currency} at each entry&apos;s rate.</span>
            </p>
          </div>
        ) : (
          <div className="tool-panel tool-empty">
            <p>No time tracked {rangeLabel.toLowerCase()}.</p>
            {range !== 'all' && (
              <button
                className="btn btn-secondary"
                onClick={() => setRange('all')}
              >
                Show all time
              </button>
            )}
          </div>
        ))}
      {tab === 'invoices' && (
        <div className="tool-stack">
          <section className="tool-panel">
            <div className="tool-row tool-row--between tool-panel__head">
              <h2>Invoices</h2>
              <div className="tool-row time-invoices-actions">
                <button
                  className="btn btn-secondary"
                  disabled={!store.ready}
                  onClick={() => invoiceImportRef.current?.click()}
                >
                  <FileUp size={15} /> Import invoice
                </button>
                <input
                  hidden
                  ref={invoiceImportRef}
                  type="file"
                  aria-label="Import invoice file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) void importInvoice(file);
                  }}
                />
                <button
                  className="btn btn-primary"
                  disabled={!store.ready}
                  onClick={() => void newInvoice()}
                >
                  <Plus size={15} /> New invoice
                </button>
              </div>
            </div>
            {!data.invoices.length ? (
              <div className="tool-empty">
                No invoices yet. Select billable time entries and choose Create
                invoice, or start a blank one with New invoice.
              </div>
            ) : (
              <div className="tool-table-wrap">
                <table className="tool-table time-invoices">
                  <thead>
                    <tr>
                      <th scope="col">Invoice</th>
                      <th scope="col">Client</th>
                      <th scope="col">Issued</th>
                      <th scope="col">Due</th>
                      <th scope="col" className="time-num">
                        Total
                      </th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((item) => {
                      const state = invoiceStatus(item, today);
                      const current = item.id === invoice?.id;
                      return (
                        <tr
                          key={item.id}
                          className={`time-invoice-row${current ? ' time-invoice-row--current' : ''}`}
                          onClick={() => openInvoice(item.id)}
                        >
                          <td className="time-invoice__num">
                            <button
                              type="button"
                              className="time-invoice__open"
                              aria-label={`Open ${item.number || 'untitled invoice'}`}
                              aria-current={current ? 'true' : undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                openInvoice(item.id);
                              }}
                            >
                              {item.number || 'Untitled'}
                            </button>
                          </td>
                          <td className="time-invoice__client">
                            {item.client || (
                              <span className="tool-muted">No client</span>
                            )}
                          </td>
                          <td className="time-invoice__date">
                            <span className="time-invoice__k">Issued </span>
                            {longDate(item.date)}
                          </td>
                          <td className="time-invoice__due">
                            <span className="time-invoice__k">Due </span>
                            {longDate(item.due)}
                          </td>
                          <td className="time-num time-invoice__total">
                            {money(invoiceTotals(item).total, item.currency)}
                          </td>
                          <td className="time-invoice__status">
                            <span
                              className={`time-status ${STATUS_CLASS[state]}`}
                            >
                              {state}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {invoice && (
            <>
              <section
                className="tool-panel time-invoice-editor"
                ref={editorRef}
              >
                <div className="time-invoice-head">
                  <div className="time-invoice-head__title">
                    <h2>{invoice.number || 'Untitled invoice'}</h2>
                    <span
                      className={`time-status ${STATUS_CLASS[invoiceStatus(invoice, today)]}`}
                    >
                      {invoiceStatus(invoice, today)}
                    </span>
                    <span className="time-savestate" aria-live="polite">
                      {store.status === 'Saving…'
                        ? 'Saving…'
                        : savedAt
                          ? `Saved ${clock(savedAt)}`
                          : 'Autosaves on this device'}
                    </span>
                  </div>
                  <div className="time-invoice-actions">
                    <button
                      className="btn btn-primary"
                      disabled={!store.ready}
                      onClick={() => void saveInvoice()}
                    >
                      <Save size={15} /> Save
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={pdfBusy}
                      onClick={() => void downloadPdf()}
                    >
                      <FileDown size={15} /> Download PDF
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        const old = document.title;
                        document.title = invoice.number;
                        window.print();
                        document.title = old;
                      }}
                    >
                      <Printer size={15} /> Print / Save PDF
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        exportJSON(
                          `${fileBase(invoice)}.invoice.json`,
                          invoiceFile(invoice),
                        );
                        setMessage(
                          `${invoice.number}.invoice.json exported. Use Import invoice to open it on another device.`,
                        );
                      }}
                    >
                      <Download size={15} /> Export invoice
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={!store.ready}
                      onClick={duplicateInvoice}
                    >
                      <Copy size={15} /> Duplicate
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={!store.ready}
                      onClick={() => patchInvoice({ paid: !invoice.paid })}
                    >
                      {invoice.paid ? 'Mark unpaid' : 'Mark paid'}
                    </button>
                    <button
                      className="btn btn-secondary time-danger"
                      disabled={!store.ready}
                      onClick={async () => {
                        if (
                          window.confirm(
                            'Delete this invoice and make its time entries available to invoice again?',
                          )
                        ) {
                          const gone = invoice.number;
                          if (
                            await update((s) => ({
                              ...s,
                              invoices: s.invoices.filter(
                                (i) => i.id !== invoice.id,
                              ),
                              deleted: { ...(s.deleted ?? {}), [invoice.id]: Date.now() },
                            }))
                          ) {
                            setInvoiceId(null);
                            setSavedAt(null);
                            setMessage(
                              `${gone} deleted. Its time entries can be invoiced again.`,
                            );
                          }
                        }
                      }}
                    >
                      <Trash2 size={15} /> Delete invoice
                    </button>
                  </div>
                </div>
                <fieldset
                  disabled={!store.ready}
                  className="tool-fieldset tool-fieldset--spaced"
                >
                  <div className="tool-fields time-invoice-facts">
                    <Field id={fid('inv-number')} label="Invoice number">
                      <input
                        id={fid('inv-number')}
                        value={invoice.number}
                        onChange={(e) =>
                          patchInvoice({ number: e.target.value })
                        }
                      />
                    </Field>
                    <Field id={fid('inv-date')} label="Issue date">
                      <input
                        id={fid('inv-date')}
                        type="date"
                        value={invoice.date}
                        onChange={(e) => {
                          if (e.target.value)
                            patchInvoice({ date: e.target.value });
                        }}
                      />
                    </Field>
                    <Field id={fid('inv-due')} label="Due date">
                      <input
                        id={fid('inv-due')}
                        type="date"
                        value={invoice.due}
                        onChange={(e) => {
                          if (e.target.value)
                            patchInvoice({ due: e.target.value });
                        }}
                      />
                    </Field>
                    <Field id={fid('inv-tax')} label="Tax %">
                      <NumberInput
                        id={fid('inv-tax')}
                        max={100}
                        step="0.01"
                        value={invoice.tax}
                        onValue={(v) => patchInvoice({ tax: v })}
                      />
                    </Field>
                    <Field
                      id={fid('inv-discount')}
                      label={`Discount (${invoice.currency})`}
                    >
                      <NumberInput
                        id={fid('inv-discount')}
                        max={1e12}
                        step="0.01"
                        value={invoice.discount}
                        onValue={(v) => patchInvoice({ discount: v })}
                      />
                    </Field>
                  </div>
                  <div className="tool-fields time-invoice-parties">
                    <Field
                      id={fid('inv-from')}
                      label="From"
                      multiline
                      speech={{
                        name: 'your business details',
                        long: true,
                        onText: (t) =>
                          changeInvoice((item) => ({
                            ...item,
                            from: appendSpoken(item.from, t),
                          })),
                      }}
                    >
                      <textarea
                        id={fid('inv-from')}
                        rows={3}
                        placeholder="Your business name and address"
                        value={invoice.from}
                        onChange={(e) => patchInvoice({ from: e.target.value })}
                      />
                    </Field>
                    <Field
                      id={fid('inv-client')}
                      label="Client name"
                      speech={{
                        name: 'client',
                        onText: (t) =>
                          changeInvoice((item) => ({
                            ...item,
                            client: appendSpoken(item.client, t),
                          })),
                      }}
                    >
                      <input
                        id={fid('inv-client')}
                        value={invoice.client}
                        list="time-invoice-clients"
                        placeholder="Who is paying"
                        onChange={(e) =>
                          patchInvoice({ client: e.target.value })
                        }
                      />
                    </Field>
                    <Field
                      id={fid('inv-address')}
                      label="Client address"
                      multiline
                      speech={{
                        name: 'bill-to address',
                        long: true,
                        onText: (t) =>
                          changeInvoice((item) => ({
                            ...item,
                            address: appendSpoken(item.address, t),
                          })),
                      }}
                    >
                      <textarea
                        id={fid('inv-address')}
                        rows={3}
                        value={invoice.address}
                        onChange={(e) =>
                          patchInvoice({ address: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <datalist id="time-invoice-clients">
                    {clients.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </datalist>
                  <div className="time-lines">
                    <h3>Line items</h3>
                    {invoice.lines.length > 0 && (
                      <div className="time-line time-line--head" aria-hidden="true">
                        <span>Description</span>
                        <span>Qty / hours</span>
                        <span>Rate</span>
                        <span>Amount</span>
                        <span />
                      </div>
                    )}
                    {!invoice.lines.length && (
                      <p className="tool-muted time-lines__empty">
                        No line items yet. Add one below.
                      </p>
                    )}
                    {invoice.lines.map((line, index) => {
                      const n = index + 1;
                      const cur = invoice.currency;
                      return (
                        <div className="time-line" key={line.id}>
                          <div className="time-line__desc">
                            <DictateField
                              label={`line ${n}`}
                              onText={(t) =>
                                changeInvoice((item) => ({
                                  ...item,
                                  lines: item.lines.map((l) =>
                                    l.id === line.id
                                      ? {
                                          ...l,
                                          description: appendSpoken(
                                            l.description,
                                            t,
                                          ),
                                        }
                                      : l,
                                  ),
                                }))
                              }
                            >
                              <input
                                aria-label={`Line ${n} description`}
                                placeholder="What you are billing for"
                                value={line.description}
                                onChange={(e) =>
                                  patchLine(line.id, {
                                    description: e.target.value,
                                  })
                                }
                              />
                            </DictateField>
                            {!line.manual && (
                              <small className="time-line__from">
                                From time entry ·{' '}
                                {line.project ? `${line.project} · ` : ''}
                                {line.date}
                              </small>
                            )}
                          </div>
                          <div className="time-line__qty">
                            <span className="time-line__k" aria-hidden="true">
                              {line.manual ? 'Qty' : 'Time'}
                            </span>
                            {line.manual ? (
                              <NumberInput
                                aria-label={`Line ${n} quantity`}
                                max={1_000_000}
                                step="any"
                                value={lineQuantity(line)}
                                onValue={(v) =>
                                  patchLine(line.id, { quantity: v })
                                }
                              />
                            ) : (
                              <span
                                className="time-line__static"
                                aria-label={`Line ${n} time`}
                                title="Tracked time is fixed. Edit the time entry before invoicing to change it."
                              >
                                {duration(line.seconds)}
                              </span>
                            )}
                          </div>
                          <div className="time-line__rate">
                            <span className="time-line__k" aria-hidden="true">
                              Rate
                            </span>
                            {line.manual ? (
                              <NumberInput
                                aria-label={`Line ${n} rate`}
                                max={1_000_000}
                                step="0.01"
                                value={line.rate}
                                onValue={(v) => patchLine(line.id, { rate: v })}
                              />
                            ) : (
                              <span
                                className="time-line__static"
                                aria-label={`Line ${n} rate`}
                              >
                                {money(
                                  Math.round(line.rate * 10 ** minorDigits(cur)),
                                  cur,
                                )}
                              </span>
                            )}
                          </div>
                          <div className="time-line__amount">
                            <span className="time-line__k" aria-hidden="true">
                              Amount
                            </span>
                            <strong aria-label={`Line ${n} amount`}>
                              {money(lineAmount(line, cur), cur)}
                            </strong>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon time-line__remove"
                            aria-label={`Remove line ${n}`}
                            title={
                              line.manual
                                ? 'Remove line'
                                : 'Remove line (its time entry can be invoiced again)'
                            }
                            onClick={() =>
                              changeInvoice((item) => ({
                                ...item,
                                lines: item.lines.filter(
                                  (l) => l.id !== line.id,
                                ),
                              }))
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="time-lines__foot">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          changeInvoice((item) => ({
                            ...item,
                            lines: [...item.lines, manualLine(item)],
                          }));
                          requestAnimationFrame(() => {
                            const inputs =
                              editorRef.current?.querySelectorAll<HTMLInputElement>(
                                '.time-line__desc input',
                              );
                            inputs?.[inputs.length - 1]?.focus();
                          });
                        }}
                      >
                        <Plus size={15} /> Add line
                      </button>
                      <p className="time-lines__total">
                        <span>Total due</span>
                        <strong>
                          {money(invoiceTotals(invoice).total, invoice.currency)}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <Field
                    id={fid('inv-notes')}
                    label="Payment instructions / notes"
                    multiline
                    speech={{
                      name: 'payment notes',
                      long: true,
                      onText: (t) =>
                        changeInvoice((item) => ({
                          ...item,
                          notes: appendSpoken(item.notes, t),
                        })),
                    }}
                  >
                    <textarea
                      id={fid('inv-notes')}
                      rows={2}
                      value={invoice.notes}
                      onChange={(e) => patchInvoice({ notes: e.target.value })}
                    />
                  </Field>
                </fieldset>
              </section>
              <InvoicePaper invoice={invoice} />
            </>
          )}
          <section className="tool-panel">
            <h2>Business defaults</h2>
            <div className="tool-fields">
              <Field
                id={fid('business')}
                label="Business name and address"
                multiline
                speech={{
                  name: 'business defaults',
                  long: true,
                  onText: (t) =>
                    void update((s) => ({
                      ...s,
                      business: appendSpoken(s.business, t),
                    })),
                }}
              >
                <textarea
                  id={fid('business')}
                  rows={3}
                  value={data.business}
                  disabled={!store.ready}
                  onChange={(e) =>
                    void update((s) => ({ ...s, business: e.target.value }))
                  }
                />
              </Field>
              <Field id={fid('currency')} label="Currency for new invoices">
                <select
                  id={fid('currency')}
                  value={data.currency}
                  disabled={!store.ready}
                  onChange={(e) =>
                    void update((s) => ({ ...s, currency: e.target.value }))
                  }
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="tool-hint tool-muted">
              New invoices start with these details. Each invoice keeps the
              currency it was created with.
            </p>
          </section>
        </div>
      )}
    </ToolShell>
  );
}
