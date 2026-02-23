import React from 'react';

interface StatusBarProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function StatusBar({ leftContent, rightContent }: StatusBarProps) {
  return (
    <div className="status-bar" style={{
      background: 'var(--light)',
      borderTop: '1px solid var(--border)',
      padding: '0.4rem 1rem',
      fontSize: '0.8rem',
      color: 'var(--secondary)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>{leftContent}</div>
      <div>{rightContent}</div>
    </div>
  );
}