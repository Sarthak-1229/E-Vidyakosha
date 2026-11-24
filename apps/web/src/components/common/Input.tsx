import { type InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', required, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="form-label">
            <span>
              {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
            </span>
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          required={required}
          className={`form-input ${error ? 'has-error' : ''} ${className}`.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
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
