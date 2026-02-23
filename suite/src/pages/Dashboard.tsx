import { Link, useNavigate } from 'react-router-dom';
import { FileText, Table, Presentation, Moon, Sun, Clock, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { listDocuments, deleteDocument } from '../utils/db';

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

export default function Dashboard({ toggleTheme, isDarkMode }: DashboardProps) {
  const [recentDocs, setRecentDocs] = useState<DocMeta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecentDocs();
  }, []);

  const loadRecentDocs = async () => {
    try {
      const docs = await listDocuments();
      setRecentDocs(docs);
    } catch (err) {
      console.error("Failed to load recent documents", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(id);
      loadRecentDocs();
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'word': return <FileText size={20} color="#2b579a" />;
      case 'excel': return <Table size={20} color="#217346" />;
      case 'powerpoint': return <Presentation size={20} color="#d24726" />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header className="dashboard-header" style={{ position: 'relative', flexShrink: 0 }}>
        <button 
          onClick={toggleTheme} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥷</div>
        <h1>OfficeNinja</h1>
        <p>A modern, lightweight office suite right in your browser.</p>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <h2 style={{ maxWidth: '1200px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
          Create New
        </h2>
        <div className="app-grid" style={{ paddingTop: '0', paddingBottom: '2rem' }}>
          <Link to="/word" className="app-card">
            <div className="app-icon word">
              <FileText size={40} />
            </div>
            <h2>NinjaWord</h2>
            <p>Write beautiful documents with rich text, tables, and export options.</p>
          </Link>

          <Link to="/excel" className="app-card">
            <div className="app-icon excel">
              <Table size={40} />
            </div>
            <h2>NinjaCalc</h2>
            <p>Powerful spreadsheets with formulas, formatting, and data analysis.</p>
          </Link>

          <Link to="/powerpoint" className="app-card">
            <div className="app-icon powerpoint">
              <Presentation size={40} />
            </div>
            <h2>NinjaSlides</h2>
            <p>Create stunning presentations visually right in the browser.</p>
          </Link>
        </div>

        {recentDocs.length > 0 && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text)' }}>
              <Clock size={24} /> Recent Files
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {recentDocs.map(doc => (
                <div 
                  key={doc.id} 
                  className="app-card" 
                  style={{ display: 'flex', alignItems: 'center', padding: '1rem', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => navigate(`/${doc.type}?id=${doc.id}`)}
                >
                  <div style={{ marginRight: '1rem', background: 'var(--light)', padding: '0.5rem', borderRadius: '8px' }}>
                    {getIcon(doc.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)' }}>{doc.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', margin: 0 }}>{formatDate(doc.updatedAt)}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, doc.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem', opacity: 0.7 }}
                    title="Delete File"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}