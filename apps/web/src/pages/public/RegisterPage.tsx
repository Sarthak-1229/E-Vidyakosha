import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { getErrorMessage } from '../../api';
import {
  validateEmailInput,
  validateNameInput,
  validatePasswordInput,
} from '../../lib/validation';
import { getRoleHomePath } from '../../lib/navigation';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: checkingAuth, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<string | null>(null);

  if (!checkingAuth && isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  const validate = (): boolean => {
    setServerError(null);
    const nErr = validateNameInput(name, 'Full name') ?? '';
    const eErr = validateEmailInput(email, { requireInstitution: true }) ?? '';
    const pErr = validatePasswordInput(password, { minLength: 8 }) ?? '';
    const cErr =
      !confirmPassword
        ? 'Please confirm your password.'
        : password !== confirmPassword
        ? 'Passwords do not match.'
        : '';

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);

    return !nErr && !eErr && !pErr && !cErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // FR-01 & D-07: Registration does not return JWT and does not auto log in
      setSuccessUser(user.name);
      showToast('Registration successful! Please sign in.', 'success');
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (successUser) {
    return (
      <section className="sign-section">
        <div className="signin-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '8px',
              background: 'var(--c-success-bg)',
              border: '1px solid var(--c-success-border)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              color: 'var(--c-success-icon)',
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <h2>Account Created!</h2>
          <p style={{ marginTop: '10px', marginBottom: '22px' }}>
            Welcome, <strong>{successUser}</strong>. Your Student account has been registered.
            Per institutional security policy, sign in with your credentials to begin exploring.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/sign-in')}
            style={{ width: '100%' }}
            rightIcon={<ArrowRight size={15} />}
          >
            Proceed to Sign In
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="sign-section">
      <div className="signin-card">
        <span className="eyebrow">Student Self-Registration</span>
        <h1 style={{ marginBottom: '6px' }}>Create your account.</h1>
        <p style={{ fontSize: '13px', marginBottom: '20px' }}>
          Available for enrolled students with an official <strong>@mitaoe.ac.in</strong> email.
        </p>

        {serverError && <ErrorAlert message={serverError} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="register-name"
            label="Full Name"
            type="text"
            maxLength={120}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="Aditi Deshmukh"
            required
            error={nameError || undefined}
            autoComplete="name"
          />

          <Input
            id="register-email"
            label="Institutional Email (@mitaoe.ac.in)"
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            placeholder="prn.name@mitaoe.ac.in"
            required
            hint="Only official @mitaoe.ac.in email addresses are accepted."
            error={emailError || undefined}
            autoComplete="email"
          />

          <Input
            id="register-password"
            label="Password (8–128 characters)"
            type="password"
            maxLength={128}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            placeholder="Minimum 8 characters"
            required
            error={passwordError || undefined}
            autoComplete="new-password"
          />

          <Input
            id="register-confirm-password"
            label="Confirm Password"
            type="password"
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmError) setConfirmError('');
            }}
            placeholder="Re-enter password"
            required
            error={confirmError || undefined}
            autoComplete="new-password"
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--c-text-muted)',
              padding: '8px 10px',
              background: 'var(--c-surface-subtle)',
              border: '1px solid var(--c-border)',
              borderRadius: '4px',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={15} color="var(--c-success-icon)" />
            <span>Account role is automatically assigned as STUDENT</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            style={{ width: '100%' }}
            rightIcon={<ArrowRight size={15} />}
          >
            Create Student Account
          </Button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--c-divider)',
            textAlign: 'center',
            fontSize: '13px',
          }}
        >
          <span style={{ color: 'var(--c-text-secondary)' }}>Already have an account? </span>
          <Link
            to="/sign-in"
            style={{ fontWeight: 600, color: 'var(--c-accent-pressed)', textDecoration: 'underline' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
};
