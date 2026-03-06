import type { LucideProps } from 'lucide-react';
import React, { useState } from 'react';
import { Settings2, X } from 'lucide-react';

interface ToolbarButtonProps {
  icon: React.ComponentType<LucideProps>;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  title?: string;
}

interface ToolbarGroupProps {
  children: React.ReactNode;
  label?: string;
}

export function ToolbarButton({ icon: Icon, onClick, isActive, isDisabled, title }: ToolbarButtonProps) {
  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      type="button"
      aria-pressed={isActive}
    >
      <Icon size={18} />
    </button>
  );
}

export function ToolbarGroup({ children, label }: ToolbarGroupProps) {
  return (
    <section className="toolbar-group">
      {label && <span className="toolbar-group-label">{label}</span>}
      <div className="toolbar-group-controls">{children}</div>
    </section>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <div className="toolbar-shell">
        <div className="toolbar">{children}</div>
      </div>

      <div className="mobile-toolbar-launcher">
        <button className="mobile-toolbar-toggle" onClick={() => setIsMobileOpen(true)} type="button">
          <Settings2 size={18} />
          <span>Ribbon</span>
        </button>
      </div>

      <div
        className={`mobile-toolbar-modal ${isMobileOpen ? 'open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden={!isMobileOpen}
      >
        <div className="mobile-toolbar-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-toolbar-header">
            <div>
              <span className="mobile-toolbar-title">Quick Tools</span>
              <span className="mobile-toolbar-subtitle">Editing tools optimized for smaller screens.</span>
            </div>
            <button className="mobile-toolbar-close" onClick={() => setIsMobileOpen(false)} type="button">
              <X size={20} />
            </button>
          </div>
          <div className="mobile-toolbar-body">{children}</div>
        </div>
      </div>
    </>
  );
}
