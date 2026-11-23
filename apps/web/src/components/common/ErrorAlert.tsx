import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '../../api';

export interface ErrorAlertProps {
  message?: string | undefined;
  error?: unknown | undefined;
  title?: string | undefined;
  type?: 'error' | 'warning' | 'info' | 'success' | undefined;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  error,
  title,
  type = 'error',
}) => {
  let displayMessage = message;

  if (!displayMessage && error) {
    displayMessage = getErrorMessage(error);
  }

  if (!displayMessage) return null;

  const alertClass =
    type === 'error'
      ? 'alert alert-error'
      : type === 'warning'
      ? 'alert alert-warning'
      : type === 'success'
      ? 'alert alert-success'
      : 'alert alert-info';

  const icon =
    type === 'error' ? (
      <AlertCircle size={18} />
    ) : type === 'warning' ? (
      <AlertTriangle size={18} />
    ) : type === 'success' ? (
      <CheckCircle2 size={18} />
    ) : (
      <Info size={18} />
    );

  return (
    <div className={alertClass} role="alert">
      {icon}
      <div>
        {title && <div style={{ fontWeight: 700, marginBottom: '2px' }}>{title}</div>}
        <div>{displayMessage}</div>
      </div>
    </div>
  );
};
