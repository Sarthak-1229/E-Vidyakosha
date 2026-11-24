import { type InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, type = 'text', className = '', required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || props.name || generatedId;
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === 'password';
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const inputElement = (
      <input
        id={inputId}
        ref={ref}
        type={effectiveType}
        required={required}
        className={`form-input ${error ? 'has-error' : ''} ${className}`.trim()}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
    );

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            <span>
              {label} {required && <span style={{ color: 'var(--c-danger)' }}>*</span>}
            </span>
          </label>
        )}
        {isPassword ? (
          <div className="password-field-wrap">
            {inputElement}
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide secret characters' : 'Reveal secret characters'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        ) : (
          inputElement
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="form-hint">
            {hint}
          </span>
        )}
        {error && (
          <span id={`${inputId}-error`} className="form-error-text" role="alert">
            <AlertCircle size={13} />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
