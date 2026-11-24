import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC<{ size?: number; label?: string }> = ({
  size = 32,
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
        padding: '36px',
        gap: '12px',
      }}
    >
      <Loader2 size={size} className="spin-animate" color="#1e3a8a" />
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
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '180px',
        opacity: 0.7,
      }}
    >
      <div
        style={{
          width: '35%',
          height: '20px',
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '6px',
        }}
      />
      <div
        style={{
          width: '85%',
          height: '24px',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '6px',
        }}
      />
      <div
        style={{
          width: '60%',
          height: '16px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '6px',
          marginTop: 'auto',
        }}
      />
    </div>
  );
};
