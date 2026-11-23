import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { getErrorMessage } from '../../api';
import { ArrowRight, KeyRound } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both institutional email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login({ email: email.trim(), password });
      showToast(`Welcome back, ${user.name}!`, 'success');

      // Navigate to previous location or role-specific landing
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'ADMIN') {
          navigate('/admin/approvals', { replace: true });
        } else if (user.role === 'FACULTY') {
          navigate('/faculty/submissions', { replace: true });
        } else {
          navigate('/library', { replace: true });
        }
      }
    } catch (err: unknown) {
      // FR-02: invalid email and password share generic error
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
  };

  return (
    <section className="sign-section">
      <div className="glass-card signin-card">
        <span className="eyebrow">AUTHENTICATED ACCESS</span>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome back.</h1>
        <p style={{ fontSize: '14px', marginBottom: '24px' }}>
          Sign in to access your course materials and academic workspaces.
        </p>

        {errorMessage && <ErrorAlert message={errorMessage} />}

        <form onSubmit={handleSubmit}>
          <Input
            id="login-email"
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@mitaoe.ac.in"
            required
            autoComplete="email"
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            style={{ width: '100%', marginTop: '8px' }}
            rightIcon={<ArrowRight size={16} />}
          >
            Sign In
          </Button>
        </form>

        {/* Quick Testing Demo Accounts */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(15, 23, 42, 0.1)',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: 'var(--c-slate)',
              marginBottom: '10px',
            }}
          >
            <KeyRound size={14} /> Quick Demo Accounts (MSS v2.0):
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fillQuickAccount('student@mitaoe.ac.in')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              Student
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fillQuickAccount('faculty@mitaoe.ac.in')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              Faculty
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => fillQuickAccount('admin@mitaoe.ac.in')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.25)',
              }}
            >
              Admin
            </button>
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--c-text-secondary)' }}>Are you a new student? </span>
          <Link
            to="/register"
            style={{ fontWeight: 700, color: 'var(--c-midnight)', textDecoration: 'underline' }}
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
};
