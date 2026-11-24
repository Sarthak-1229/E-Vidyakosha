import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: number; label?: string }> = ({
  size = 28,
  label = 'Loading...',
}) => {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        gap: '10px',
      }}
    >
      <Loader2 size={size} className="spin-animate" color="var(--c-accent)" />
      {label && (
        <span style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
      )}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div
      className="doc-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '176px',
      }}
    >
      <div
        style={{
          width: '38%',
          height: '18px',
          background: 'var(--c-surface-hover)',
          borderRadius: '4px',
        }}
      />
      <div
        style={{
          width: '88%',
          height: '22px',
          background: 'var(--c-surface-hover)',
          borderRadius: '4px',
        }}
      />
      <div
        style={{
          width: '55%',
          height: '15px',
          background: 'var(--c-surface-subtle)',
          borderRadius: '4px',
          marginTop: 'auto',
        }}
      />
    </div>
  );
};
