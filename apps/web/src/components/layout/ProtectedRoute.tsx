import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../common/Spinner';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import type { UserRole } from '../../api/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: '72px 0', display: 'grid', placeItems: 'center' }}>
        <Spinner size={30} label="Verifying session authorization..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div
        className="panel"
        style={{
          maxWidth: '520px',
          margin: '48px auto',
          textAlign: 'center',
          padding: '36px 28px',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '8px',
            background: 'var(--c-danger-bg)',
            border: '1px solid var(--c-danger-border)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
            color: 'var(--c-danger)',
          }}
        >
          <ShieldAlert size={26} />
        </div>
        <h2>Access Restricted</h2>
        <p style={{ marginTop: '8px', marginBottom: '22px' }}>
          Your signed-in role (<strong>{user.role}</strong>) does not have permission to open this
          workspace.
        </p>
        <Link to="/library" className="btn btn-primary">
          <ArrowLeft size={15} /> Return to Library
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
