import { type SelectHTMLAttributes, forwardRef, useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  options?: SelectOption[] | undefined;
  children?: ReactNode | undefined;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, className = '', options, children, required, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || props.name || generatedId;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={selectId} className="form-label">
            <span>
              {label} {required && <span style={{ color: 'var(--c-danger)' }}>*</span>}
            </span>
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          className={`form-select ${error ? 'has-error' : ''} ${className}`.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {hint && !error && (
          <span id={`${selectId}-hint`} className="form-hint">
            {hint}
          </span>
        )}
        {error && (
          <span id={`${selectId}-error`} className="form-error-text" role="alert">
            <AlertCircle size={13} />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
