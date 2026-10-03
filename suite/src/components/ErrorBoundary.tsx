import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Without this, a single throw anywhere in an editor unmounts the whole tree and
 * leaves a blank white page — no chrome, no message, and any unsaved work gone
 * with no route back. This keeps the shell alive and gives the user somewhere to go.
 *
 * It deliberately does NOT try to auto-save on crash: the state that threw is the
 * state we would be persisting, and writing it over a good record could turn a
 * recoverable crash into permanent corruption. Autosave and the pagehide snapshot
 * remain the durability story.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in the workspace', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    // Full document load, not a hash change: the crashed subtree must be torn down.
    window.location.href = `${window.location.pathname}#/`;
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100%',
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
          color: 'var(--text)',
        }}
      >
        <div
          style={{
            width: 'min(520px, 100%)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg, 1.5rem)',
            border: '1px solid var(--border)',
            background: 'var(--surface-solid, #fff)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.375rem' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)' }}>
            This editor hit an unexpected error and stopped. Your saved documents are safe on this
            device — but any edits made since the last autosave may not have been written.
          </p>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)' }}>
            Reloading usually recovers the document from its last saved state.
          </p>
          <pre
            style={{
              margin: '0 0 1.25rem',
              padding: '0.75rem',
              overflowX: 'auto',
              fontSize: '0.8125rem',
              borderRadius: 'var(--radius-xs, 0.5rem)',
              background: 'var(--surface-muted, rgba(0,0,0,0.05))',
              color: 'var(--text-muted)',
            }}
          >
            {error.message || String(error)}
          </pre>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={this.handleReload} type="button">
              Reload this document
            </button>
            <button className="btn btn-secondary" onClick={this.handleGoHome} type="button">
              Back to workspace
            </button>
          </div>
        </div>
      </div>
    );
  }
}
