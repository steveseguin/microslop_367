import React from 'react';

interface StatusBarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function StatusBar({ leftContent, rightContent }: StatusBarProps) {
  return (
    <footer className="status-bar" aria-live="polite">
      <div className="status-bar__segment">{leftContent}</div>
      <div className="status-bar__segment status-bar__segment--right">{rightContent}</div>
    </footer>
  );
}
