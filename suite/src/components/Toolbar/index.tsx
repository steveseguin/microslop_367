import type { LucideProps } from 'lucide-react';
import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';

interface ToolbarButtonProps {
  icon: React.ComponentType<LucideProps>;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  title?: string;
}

export function ToolbarButton({ icon: Icon, onClick, isActive, isDisabled, title }: ToolbarButtonProps) {
  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
    >
      <Icon size={18} />
    </button>
  );
}

export function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="toolbar-group">{children}</div>;
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      <div className="toolbar">{children}</div>
      
      {/* Mobile Toggle Button */}
      <div style={{ padding: '0.5rem', background: 'var(--light)', borderBottom: '1px solid var(--border)' }} className="mobile-only-header">
        <button className="mobile-toolbar-toggle" onClick={() => setIsMobileOpen(true)}>
          <Settings size={18} /> Tools & Settings
        </button>
      </div>

      {/* Mobile Modal */}
      <div className={`mobile-toolbar-modal ${isMobileOpen ? 'open' : ''}`} onClick={() => setIsMobileOpen(false)}>
        <div className="mobile-toolbar-content" onClick={e => e.stopPropagation()}>
          <div className="mobile-toolbar-header">
            <span>Tools & Settings</span>
            <button className="mobile-toolbar-close" onClick={() => setIsMobileOpen(false)}>
              <X size={24} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}