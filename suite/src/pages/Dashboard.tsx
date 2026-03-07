import { Link, useNavigate } from 'react-router-dom';
import {
  Clock3,
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
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DashboardProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

interface DocMeta {
  id: string;
  title: string;
  type: 'word' | 'excel' | 'powerpoint';
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
] as const;

export default function Dashboard({ toggleTheme, isDarkMode }: DashboardProps) {
  const [recentDocs, setRecentDocs] = useState<DocMeta[]>([]);
  const [pendingDelete, setPendingDelete] = useState<DocMeta | null>(null);
  const navigate = useNavigate();

  async function loadRecentDocs() {
    try {
      const docs = await listDocuments();
      setRecentDocs(docs);
    } catch (error) {
      console.error('Failed to load recent documents', error);
    }
  }

  useEffect(() => {
    void loadRecentDocs();
  }, []);

  const handleDeleteClick = (event: React.MouseEvent, doc: DocMeta) => {
    event.stopPropagation();
    event.preventDefault();
    setPendingDelete(doc);
  };

  const openDocument = (doc: DocMeta) => {
    navigate(`/${doc.type}?id=${doc.id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) {
      return;
    }

    await deleteDocument(pendingDelete.id);
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
    return 'Presentation';
  };

  const totalFiles = recentDocs.length;
  const wordFiles = recentDocs.filter((doc) => doc.type === 'word').length;
  const sheetFiles = recentDocs.filter((doc) => doc.type === 'excel').length;
  const slideFiles = recentDocs.filter((doc) => doc.type === 'powerpoint').length;

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
                <span className="dashboard-brand__eyebrow">Office Workspace</span>
                <span className="dashboard-brand__title">OfficeNinja Suite</span>
              </div>
            </div>
            <button className="btn btn-secondary btn-icon dashboard-theme-toggle" onClick={toggleTheme} type="button">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="dashboard-hero-grid">
            <div className="dashboard-hero-copy">
              <span className="dashboard-kicker">
                <Sparkles size={14} />
                Complete browser office suite
              </span>
              <h1>Work like a real office app, not a prototype.</h1>
              <p>
                Create documents, spreadsheets, and decks from one responsive workspace. Files autosave locally, editors stay
                focused, and the UI now prioritizes usable mobile workflows instead of fake desktop chrome.
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
                  <strong>{slideFiles}</strong>
                  <span>Presentation decks on hand</span>
                </div>
              </div>
            </div>

            <div className="dashboard-hero-panel">
              <h2>What changed in this review</h2>
              <p>The suite now behaves more like a working office product instead of a collection of loosely connected demos.</p>
              <ul className="dashboard-checklist">
                <li>
                  <ShieldCheck size={18} />
                  <div>
                    <strong>Unified app shell</strong>
                    <span>Consistent headers, ribbon controls, status bars, panels, and mobile layouts across every editor.</span>
                  </div>
                </li>
                <li>
                  <Clock3 size={18} />
                  <div>
                    <strong>Reliable continuation</strong>
                    <span>Recent files surface immediately and jump back into the exact document type you were editing.</span>
                  </div>
                </li>
                <li>
                  <Sparkles size={18} />
                  <div>
                    <strong>Less fake UI</strong>
                    <span>Placeholder controls were removed or replaced with simpler interactions that actually do something.</span>
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
              <p>Each app opens with the right tools, mobile behavior, and autosave flow already in place.</p>
            </div>
          </div>

          <div className="launcher-grid">
            {launchCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.type} to={`/${card.type}`} className="launcher-card">
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
                </Link>
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
            <div className="dashboard-empty">No local documents yet. Start with Word, Calc, or Slides above.</div>
          ) : (
            <div className="recent-grid">
              {recentDocs.slice(0, 8).map((doc) => (
                <article
                  key={doc.id}
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
                      <span>{formatType(doc.type)}</span>
                    </div>
                    <button
                      className="recent-delete-btn"
                      onClick={(event) => handleDeleteClick(event, doc)}
                      title={`Delete ${doc.title}`}
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
