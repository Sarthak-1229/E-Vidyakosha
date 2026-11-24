import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <section className="sign-section" style={{ textAlign: 'center' }}>
      <div className="panel" style={{ maxWidth: '480px', padding: '40px 28px', textAlign: 'center' }}>
        <div className="not-found-code" aria-hidden="true">
          <span>4</span>
          <Compass size={48} strokeWidth={1.6} />
          <span>4</span>
        </div>
        <h1 style={{ marginBottom: '8px' }}>Page Not Found</h1>
        <p style={{ marginBottom: '24px' }}>
          The page or academic resource you are seeking does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={15} /> Return to Home
        </Link>
      </div>
    </section>
  );
};
