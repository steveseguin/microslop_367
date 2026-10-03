import { Link, useNavigate } from 'react-router-dom';
import {
  Clock3,
  PenTool,
  FileText,
  LayoutTemplate,
  Moon,
  Presentation,
  ShieldCheck,
  Sparkles,
  Sun,
  Table,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { deleteDocument, listDocuments } from '../utils/db';
import { deleteDesign, designUrl, listDesigns } from '../utils/blueline';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DashboardProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface DocMeta {
  id: string;
  title: string;
  type: 'word' | 'excel' | 'powerpoint' | 'blueline';
  updatedAt: number;
}

const launchCards = [
  {
    type: 'word',
    name: 'NinjaWord',
    title: 'Write polished documents',
    description: 'Rich text editing, tables, import/export, dictation, and document insights in one focused workspace.',
    icon: FileText,
    accentClass: 'word',
  },
  {
    type: 'excel',
    name: 'NinjaCalc',
    title: 'Analyze sheets that matter',
    description: 'Editable worksheets with imports, multiple sheets, chart previews, and selection summaries that actually help.',
    icon: Table,
    accentClass: 'excel',
  },
  {
    type: 'powerpoint',
    name: 'NinjaSlides',
    title: 'Build decks quickly',
    description: 'Slide thumbnails, speaker notes, layered canvas editing, presenter mode, and PPTX round-tripping.',
    icon: Presentation,
    accentClass: 'powerpoint',
  },
  {
    type: 'blueline',
    name: 'Blueline',
    title: 'Design your next idea',
    description: 'A browser-based Figma alternative with vector tools, auto layout, reusable components, prototypes, and SVG, PNG, and HTML export.',
    icon: PenTool,
    accentClass: 'blueline',
  },
] as const;

export default function Dashboard({ toggleTheme, isDarkMode }: DashboardProps) {
  const [recentDocs, setRecentDocs] = useState<DocMeta[]>([]);
  const [pendingDelete, setPendingDelete] = useState<DocMeta | null>(null);
  const navigate = useNavigate();

  async function loadRecentDocs() {
    try {
      const results = await Promise.allSettled([listDocuments(), listDesigns()]);
      const docs = results.flatMap<DocMeta>((result) => result.status === 'fulfilled' ? result.value : []);
      setRecentDocs(docs.sort((a, b) => b.updatedAt - a.updatedAt));
      for (const result of results) {
        if (result.status === 'rejected') console.error('Could not load local files', result.reason);
      }
    } catch (error) {
      console.error('Failed to load recent documents', error);
    }
  }

  useEffect(() => {
    // Storage reads finish asynchronously before updating the file list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecentDocs();
    const refresh = () => void loadRecentDocs();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const handleDeleteClick = (event: React.MouseEvent, doc: DocMeta) => {
    event.stopPropagation();
    event.preventDefault();
    setPendingDelete(doc);
  };

  const openDocument = (doc: DocMeta) => {
    if (doc.type === 'blueline') {
      window.location.assign(designUrl(doc.id));
      return;
    }
    navigate(`/${doc.type}?id=${encodeURIComponent(doc.id)}`);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) {
      return;
    }

    if (pendingDelete.type === 'blueline') await deleteDesign(pendingDelete.id);
    else await deleteDocument(pendingDelete.id);
    setPendingDelete(null);
    void loadRecentDocs();
  };

  const formatDate = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(timestamp);

  const formatType = (type: DocMeta['type']) => {
    if (type === 'word') {
      return 'Document';
    }
    if (type === 'excel') {
      return 'Spreadsheet';
    }
    return type === 'blueline' ? 'Design' : 'Presentation';
  };

  const totalFiles = recentDocs.length;
  const wordFiles = recentDocs.filter((doc) => doc.type === 'word').length;
  const sheetFiles = recentDocs.filter((doc) => doc.type === 'excel').length;
  const visualFiles = recentDocs.filter((doc) => doc.type === 'powerpoint' || doc.type === 'blueline').length;

  return (
    <div className="dashboard">
      <section className="dashboard-hero">
        <div className="dashboard-shell">
          <div className="dashboard-topbar">
            <div className="dashboard-brand">
              <div className="dashboard-brand__mark">
                <LayoutTemplate size={28} />
              </div>
              <div>
                <span className="dashboard-brand__eyebrow">Office & Design Workspace</span>
                <span className="dashboard-brand__title">OfficeNinja Suite</span>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-icon dashboard-theme-toggle"
              onClick={toggleTheme}
              type="button"
              aria-label={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="dashboard-hero-grid">
            <div className="dashboard-hero-copy">
              <span className="dashboard-kicker">
                <Sparkles size={14} />
                Your browser office and design suite
              </span>
              <h1>Make room for your next idea.</h1>
              <p>
                Write, calculate, present, and design in one browser workspace. Four focused tools, local autosave,
                and no account required. Pick an app and make something yours.
              </p>

              <div className="dashboard-hero-actions">
                <Link className="btn btn-primary" to="/word">
                  <FileText size={16} />
                  New document
                </Link>
                <Link className="btn btn-secondary" to="/excel">
                  <Table size={16} />
                  New spreadsheet
                </Link>
                <Link className="btn btn-secondary" to="/powerpoint">
                  <Presentation size={16} />
                  New presentation
                </Link>
                <a className="btn btn-secondary" href={designUrl()}>
                  <PenTool size={16} />
                  New design
                </a>
              </div>

              <div className="dashboard-stat-grid">
                <div className="dashboard-stat">
                  <strong>{totalFiles}</strong>
                  <span>Files in this workspace</span>
                </div>
                <div className="dashboard-stat">
                  <strong>{wordFiles + sheetFiles}</strong>
                  <span>Docs and sheets ready to reopen</span>
                </div>
                <div className="dashboard-stat">
                  <strong>{visualFiles}</strong>
                  <span>Decks and designs on hand</span>
                </div>
              </div>
            </div>

            <div className="dashboard-hero-panel">
              <h2>Your work. Your workspace.</h2>
              <p>From the first draft to the final design, keep your everyday tools together.</p>
              <ul className="dashboard-checklist">
                <li>
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Four tools, one home</strong>
                    <span>Move between documents, spreadsheets, presentations, and Blueline designs.</span>
                  </div>
                </li>
                <li>
                  <Clock3 size={18} />
                  <div>
                    <strong>Pick up where you left off</strong>
                    <span>Your recent files stay in this browser, ready to reopen when you return.</span>
                  </div>
                </li>
                <li>
                  <Sparkles size={18} />
                  <div>
                    <strong>Create in your own style</strong>
                    <span>Choose light or dark mode, then export your work to share or keep a backup.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-shell">
          <div className="dashboard-section-header">
            <div>
              <h2>Start something new</h2>
              <p>A focused editor for every kind of work. Choose a tool to get started.</p>
            </div>
          </div>

          <div className="launcher-grid">
            {launchCards.map((card) => {
              const Icon = card.icon;
              return (
                <a key={card.type} href={card.type === 'blueline' ? designUrl() : `#/${card.type}`} className="launcher-card">
                  <div className={`launcher-card__icon ${card.accentClass}`}>
                    <Icon size={26} />
                  </div>
                  <div>
                    <h3>{card.name}</h3>
                    <p>{card.title}</p>
                  </div>
                  <p>{card.description}</p>
                  <div className="launcher-card__footer">
                    <span>Open editor</span>
                    <span>{formatType(card.type)}</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-shell">
          <div className="dashboard-section-header">
            <div>
              <h2>Recent files</h2>
              <p>Jump back into your latest work. Files are stored locally in this browser.</p>
            </div>
          </div>

          {recentDocs.length === 0 ? (
            <div className="dashboard-empty">No local files yet. Start with Word, Calc, Slides, or Blueline above.</div>
          ) : (
            <div className="recent-grid">
              {recentDocs.slice(0, 8).map((doc) => (
                <article
                  key={`${doc.type}:${doc.id}`}
                  className="recent-card"
                  onClick={() => openDocument(doc)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openDocument(doc);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${doc.title}`}
                >
                  <div className="recent-card__header">
                    <div className="recent-card__type">
                      {doc.type === 'word' && <FileText size={14} />}
                      {doc.type === 'excel' && <Table size={14} />}
                      {doc.type === 'powerpoint' && <Presentation size={14} />}
                      {doc.type === 'blueline' && <PenTool size={14} />}
                      <span>{formatType(doc.type)}</span>
                    </div>
                    <button
                      className="recent-delete-btn"
                      onClick={(event) => handleDeleteClick(event, doc)}
                      title={`Delete ${doc.title}`}
                      aria-label={`Delete ${doc.title}`}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="recent-card__file">
                    <div className={`launcher-card__icon ${doc.type === 'powerpoint' ? 'powerpoint' : doc.type}`}>
                      {doc.type === 'word' && <FileText size={20} />}
                      {doc.type === 'excel' && <Table size={20} />}
                      {doc.type === 'powerpoint' && <Presentation size={20} />}
                      {doc.type === 'blueline' && <PenTool size={20} />}
                    </div>
                    <div className="recent-card__meta">
                      <h3>{doc.title}</h3>
                      <p>Autosaved locally</p>
                    </div>
                  </div>

                  <div className="recent-card__footer">
                    <span>Updated {formatDate(doc.updatedAt)}</span>
                    <span>Open file</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete local file?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed from this browser workspace.`
            : 'This file will be removed from this browser workspace.'
        }
        confirmLabel="Delete file"
        tone="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
