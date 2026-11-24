import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <section className="not-found" style={{ textAlign: 'center', padding: '90px 20px' }}>
      <div
        className="glass-card"
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          padding: '48px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.7)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            color: 'var(--c-slate)',
          }}
        >
          <Compass size={32} />
        </div>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Page Not Found</h1>
        <p style={{ marginBottom: '28px' }}>
          The page or academic resource you are seeking does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    </section>
  );
};
