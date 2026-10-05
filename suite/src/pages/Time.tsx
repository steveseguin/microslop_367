import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Square,
  Plus,
  Download,
  FileText,
  Trash2,
  Pencil,
  Upload,
} from 'lucide-react';
import { ToolShell, type ToolProps } from '../components/ToolShell';
import {
  csvCell,
  downloadFile,
  exportJSON,
  localDate,
  useToolStorage,
} from '../utils/toolStorage';
import {
  CURRENCIES,
  duration,
  EMPTY_TIME,
  invoiceTotals,
  lineAmount,
  money,
  validTimeBackup,
} from '../utils/time';
import type { Invoice, TimeEntry } from '../utils/time';

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
            <th>Time (h:m:s)</th>
            <th>Rate / hour</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id}>
              <td>
                {line.description}
                <br />
                <small>
                  {line.project ? `${line.project} · ` : ''}
                  {line.date}
                </small>
              </td>
              <td>{duration(line.seconds)}</td>
              <td>
                {money(
                  Math.round(
                    line.rate * 10 ** (invoice.currency === 'JPY' ? 0 : 2),
                  ),
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

export default function Time(props: ToolProps) {
  const store = useToolStorage('time', EMPTY_TIME);
  const { data, update } = store;
  const [tab, setTab] = useState<'time' | 'invoices'>('time');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [rate, setRate] = useState('75');
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
  const visible = data.entries
    .filter((entry) =>
      `${entry.description} ${entry.project} ${entry.client} ${entry.date}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const unbilled = data.entries.filter((e) => e.billable && !billed.has(e.id));
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
      setDescription('');
      setEditing(null);
      setMessage('Time entry saved.');
    }
  };
  const start = async () => {
    const entry = draftEntry();
    if (!entry || data.timer) return;
    const started = Date.now();
    setNow(started);
    if (
      await update((s) => ({
        ...s,
        timer: { ...entry, date: localDate(), started },
      }))
    )
      setMessage('Timer running. It keeps time even when this tab is closed.');
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
    )
      setMessage('Timer stopped and saved.');
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
      setSelected([]);
      setTab('invoices');
      setMessage('Invoice created. Review the details before exporting.');
    }
  };
  const patchInvoice = (patch: Partial<Invoice>) => {
    if (invoice)
      void update((s) => ({
        ...s,
        invoices: s.invoices.map((item) =>
          item.id === invoice.id ? { ...item, ...patch } : item,
        ),
      }));
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
      {tab === 'time' ? (
        <div className="tool-stack">
          <div className="tool-metrics">
            <div className="tool-metric">
              <span>Today</span>
              <strong>
                {duration(
                  data.entries
                    .filter((e) => e.date === localDate())
                    .reduce((sum, e) => sum + e.seconds, 0),
                )}
              </strong>
            </div>
            <div className="tool-metric">
              <span>Unbilled hours</span>
              <strong>
                {(
                  unbilled.reduce((sum, e) => sum + e.seconds, 0) / 3600
                ).toFixed(2)}
              </strong>
            </div>
            <div className="tool-metric">
              <span>Invoices unpaid</span>
              <strong>{data.invoices.filter((i) => !i.paid).length}</strong>
            </div>
          </div>
          <section className="tool-panel">
            <h2>{editing ? 'Edit time entry' : 'What are you working on?'}</h2>
            <fieldset
              className="tool-fieldset"
              disabled={!store.ready || !!data.timer}
            >
              <div className="tool-fields tool-fields--entry">
                <label>
                  Description
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Website design"
                  />
                </label>
                <label>
                  Client
                  <input
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    list="time-clients"
                    placeholder="Client name"
                  />
                </label>
                <label>
                  Project
                  <input
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  Hourly rate
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </label>
              </div>
              <datalist id="time-clients">
                {[...new Set(data.entries.map((e) => e.client))].map((c) => (
                  <option key={c}>{c}</option>
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
              <div className="tool-timer-bar">
                <strong className="tool-timer" aria-label="Elapsed time">
                  {duration(data.timer ? (now - data.timer.started) / 1000 : 0)}
                </strong>
                {data.timer && (
                  <span className="tool-muted tool-timer-label">
                    {data.timer.description} · {data.timer.client}
                  </span>
                )}
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
                <label>
                  Manual hours
                  <input
                    type="number"
                    min="0.0003"
                    max="87600"
                    step="any"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </label>
                <div className="tool-row">
                  <button
                    className={`btn ${editing ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => void addManual()}
                  >
                    {!editing && <Plus size={16} />}
                    {editing ? 'Save entry' : 'Add manual entry'}
                  </button>
                  {editing && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(null);
                        setDescription('');
                      }}
                    >
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
                {data.entries.length
                  ? 'No entries match your search.'
                  : 'Start a timer or add your first time entry.'}
              </div>
            ) : (
              <div className="tool-table-wrap">
                <table className="tool-table">
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Work</th>
                      <th>Date</th>
                      <th>Hours</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <input
                            aria-label={`Select ${entry.description}`}
                            type="checkbox"
                            disabled={!entry.billable || billed.has(entry.id)}
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
                        <td>
                          {entry.description}
                          <small>
                            {entry.client}
                            {entry.project ? ` / ${entry.project}` : ''}
                          </small>
                        </td>
                        <td>{entry.date}</td>
                        <td>{(entry.seconds / 3600).toFixed(2)}</td>
                        <td>{entry.rate.toFixed(2)}</td>
                        <td>
                          {billed.has(entry.id)
                            ? 'Invoiced'
                            : entry.billable
                              ? 'Unbilled'
                              : 'Non-billable'}
                        </td>
                        <td>
                          <div className="tool-row">
                            <button
                              className="btn btn-secondary btn-icon"
                              disabled={
                                billed.has(entry.id) ||
                                !!data.timer ||
                                !store.ready
                              }
                              aria-label={`Edit ${entry.description}`}
                              onClick={() => {
                                setEditing(entry.id);
                                setDescription(entry.description);
                                setClient(entry.client);
                                setProject(entry.project);
                                setRate(String(entry.rate));
                                setBillable(entry.billable);
                                setDate(entry.date);
                                setHours(String(entry.seconds / 3600));
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-icon"
                              disabled={billed.has(entry.id) || !store.ready}
                              aria-label={`Delete ${entry.description}`}
                              onClick={async () => {
                                if (
                                  await update((s) => ({
                                    ...s,
                                    entries: s.entries.filter(
                                      (e) => e.id !== entry.id,
                                    ),
                                  }))
                                ) {
                                  setUndo(entry);
                                  setSelected((s) =>
                                    s.filter((id) => id !== entry.id),
                                  );
                                  if (editing === entry.id) setEditing(null);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="tool-stack">
          <section className="tool-panel">
            <h2>Business defaults</h2>
            <div className="tool-fields">
              <label>
                Business name and address
                <textarea
                  rows={3}
                  value={data.business}
                  disabled={!store.ready}
                  onChange={(e) =>
                    void update((s) => ({ ...s, business: e.target.value }))
                  }
                />
              </label>
              <label>
                Currency for new invoices
                <select
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
                <span className="tool-hint">
                  Rates use the currency selected when an invoice is created.
                </span>
              </label>
            </div>
          </section>
          {!invoice ? (
            <div className="tool-panel tool-empty">
              Select billable time entries to create your first invoice.
            </div>
          ) : (
            <>
              <section className="tool-panel">
                <div className="tool-row tool-row--between tool-row--end">
                  <label className="tool-invoice-pick">
                    Invoice
                    <select
                      value={invoice.id}
                      onChange={(e) => setInvoiceId(e.target.value)}
                    >
                      {data.invoices.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.number} · {i.client}
                          {i.paid ? ' · Paid' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="tool-row">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const old = document.title;
                        document.title = invoice.number;
                        window.print();
                        document.title = old;
                      }}
                    >
                      Print / Save PDF
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={!store.ready}
                      onClick={() => patchInvoice({ paid: !invoice.paid })}
                    >
                      {invoice.paid ? 'Mark unpaid' : 'Mark paid'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={!store.ready}
                      onClick={async () => {
                        if (
                          window.confirm(
                            'Delete this invoice and make its time entries available to invoice again?',
                          )
                        ) {
                          await update((s) => ({
                            ...s,
                            invoices: s.invoices.filter(
                              (i) => i.id !== invoice.id,
                            ),
                          }));
                          setInvoiceId(null);
                        }
                      }}
                    >
                      Delete invoice
                    </button>
                  </div>
                </div>
                <fieldset
                  disabled={!store.ready}
                  className="tool-fieldset tool-fieldset--spaced"
                >
                  <div className="tool-fields">
                    <label>
                      Invoice number
                      <input
                        value={invoice.number}
                        onChange={(e) =>
                          patchInvoice({ number: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Issue date
                      <input
                        type="date"
                        value={invoice.date}
                        onChange={(e) => {
                          if (e.target.value)
                            patchInvoice({ date: e.target.value });
                        }}
                      />
                    </label>
                    <label>
                      Due date
                      <input
                        type="date"
                        value={invoice.due}
                        onChange={(e) => {
                          if (e.target.value)
                            patchInvoice({ due: e.target.value });
                        }}
                      />
                    </label>
                    <label>
                      Tax %
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={invoice.tax}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (v >= 0 && v <= 100) patchInvoice({ tax: v });
                        }}
                      />
                    </label>
                    <label>
                      Discount ({invoice.currency})
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoice.discount}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v >= 0 && v <= 1e12)
                            patchInvoice({ discount: v });
                        }}
                      />
                    </label>
                  </div>
                  <div className="tool-fields">
                    <label>
                      From
                      <textarea
                        rows={3}
                        value={invoice.from}
                        onChange={(e) => patchInvoice({ from: e.target.value })}
                      />
                    </label>
                    <label>
                      Client name
                      <input
                        value={invoice.client}
                        onChange={(e) =>
                          patchInvoice({ client: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Client address
                      <textarea
                        rows={3}
                        value={invoice.address}
                        onChange={(e) =>
                          patchInvoice({ address: e.target.value })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Payment instructions / notes
                    <textarea
                      rows={2}
                      value={invoice.notes}
                      onChange={(e) => patchInvoice({ notes: e.target.value })}
                    />
                  </label>
                </fieldset>
              </section>
              <InvoicePaper invoice={invoice} />
            </>
          )}
        </div>
      )}
    </ToolShell>
  );
}
