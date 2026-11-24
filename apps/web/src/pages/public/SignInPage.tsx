import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { getErrorMessage } from '../../api';
import { validateEmailInput, validatePasswordInput } from '../../lib/validation';
import { getRoleHomePath } from '../../lib/navigation';
import { ArrowRight } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: checkingAuth, login, sessionExpired } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  if (!checkingAuth && isAuthenticated && user) {
    return <Navigate to={from || getRoleHomePath(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const eErr = validateEmailInput(email);
    const pErr = validatePasswordInput(password, { requirePolicy: false });
    setEmailError(eErr ?? undefined);
    setPasswordError(pErr ?? undefined);
    if (eErr || pErr) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const signedInUser = await login({ email: email.trim().toLowerCase(), password });
      showToast(`Welcome back, ${signedInUser.name}!`, 'success');
      navigate(from || getRoleHomePath(signedInUser.role), { replace: true });
    } catch (err: unknown) {
      // FR-02: invalid email and password share generic error
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="sign-section">
      <div className="signin-card">
        <span className="eyebrow">Authenticated Access</span>
        <h1 style={{ marginBottom: '6px' }}>Welcome back.</h1>
        <p style={{ fontSize: '13.5px', marginBottom: '22px' }}>
          Sign in to access your course materials and institutional workspaces.
        </p>

        {(errorMessage || sessionExpired) && (
          <ErrorAlert message={errorMessage ?? 'Your session expired. Sign in again.'} />
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="login-email"
            label="Email"
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(undefined);
            }}
            placeholder="name@mitaoe.ac.in"
            required
            error={emailError}
            autoComplete="email"
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            maxLength={128}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(undefined);
            }}
            placeholder="Enter password"
            required
            error={passwordError}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            style={{ width: '100%', marginTop: '6px' }}
            rightIcon={<ArrowRight size={15} />}
          >
            Sign In
          </Button>
        </form>

        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--c-divider)',
            textAlign: 'center',
            fontSize: '13px',
          }}
        >
          <span style={{ color: 'var(--c-text-secondary)' }}>New student at MIT AOE? </span>
          <Link
            to="/register"
            style={{ fontWeight: 600, color: 'var(--c-accent-pressed)', textDecoration: 'underline' }}
          >
            Create student account
          </Link>
        </div>
      </div>
    </section>
  );
};
