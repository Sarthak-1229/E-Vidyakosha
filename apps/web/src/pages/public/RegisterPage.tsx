import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { getErrorMessage } from '../../api';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
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

  const validate = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setServerError(null);

    if (!name.trim()) {
      setNameError('Full name is required.');
      valid = false;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      valid = false;
    } else if (!trimmedEmail.endsWith('@mitaoe.ac.in')) {
      // FR-01: Must end with @mitaoe.ac.in
      setEmailError('Institutional email must end with @mitaoe.ac.in');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }

    return valid;
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
        <div className="glass-card signin-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
              color: '#059669',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2>Account Created!</h2>
          <p style={{ marginTop: '12px', marginBottom: '24px' }}>
            Welcome, <strong>{successUser}</strong>. Your Student account has been successfully
            registered. Per institutional security policy, please sign in with your credentials to
            begin exploring.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/sign-in')}
            style={{ width: '100%' }}
            rightIcon={<ArrowRight size={16} />}
          >
            Proceed to Sign In
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="sign-section">
      <div className="glass-card signin-card">
        <span className="eyebrow">STUDENT SELF-REGISTRATION</span>
        <h1 style={{ fontSize: '30px', marginBottom: '8px' }}>Create your account.</h1>
        <p style={{ fontSize: '13px', marginBottom: '20px' }}>
          Registration is exclusively available for enrolled students with an active{' '}
          <strong>@mitaoe.ac.in</strong> email address.
        </p>

        {serverError && <ErrorAlert message={serverError} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="register-name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aditi Deshmukh"
            required
            error={nameError || undefined}
          />

          <Input
            id="register-email"
            label="Institutional Email (@mitaoe.ac.in)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prn.name@mitaoe.ac.in"
            required
            hint="Only official @mitaoe.ac.in email addresses are accepted."
            error={emailError || undefined}
          />

          <Input
            id="register-password"
            label="Password (min 8 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            error={passwordError || undefined}
          />

          <Input
            id="register-confirm-password"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            error={confirmError || undefined}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--c-text-muted)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={16} color="#059669" />
            <span>Role is automatically assigned to STUDENT</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            style={{ width: '100%' }}
            rightIcon={<ArrowRight size={16} />}
          >
            Create Student Account
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--c-text-secondary)' }}>Already have an account? </span>
          <Link
            to="/sign-in"
            style={{ fontWeight: 700, color: 'var(--c-midnight)', textDecoration: 'underline' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
};
