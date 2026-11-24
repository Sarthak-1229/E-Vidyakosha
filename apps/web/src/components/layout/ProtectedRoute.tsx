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
      <div style={{ padding: '80px 0', display: 'grid', placeItems: 'center' }}>
        <Spinner size={36} label="Verifying authorization..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div
        className="glass-card"
        style={{
          maxWidth: '560px',
          margin: '60px auto',
          textAlign: 'center',
          padding: '48px 32px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
            color: '#dc2626',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2>Access Restricted</h2>
        <p style={{ marginTop: '10px', marginBottom: '24px' }}>
          Your current role (<strong>{user.role}</strong>) does not have permission to view
          this administrative workspace.
        </p>
        <Link to="/library" className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Library
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
