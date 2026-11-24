import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorAlert } from '../common/ErrorAlert';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = true,
  isLoading = false,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="460px"
      isDestructive={isDestructive}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error && <ErrorAlert message={error} />}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '6px',
            background: isDestructive ? 'var(--c-danger-bg)' : 'var(--c-info-bg)',
            border: `1px solid ${isDestructive ? 'var(--c-danger-border)' : 'var(--c-info-border)'}`,
            display: 'grid',
            placeItems: 'center',
            color: isDestructive ? 'var(--c-danger)' : 'var(--c-accent)',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--c-text-primary)' }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};
