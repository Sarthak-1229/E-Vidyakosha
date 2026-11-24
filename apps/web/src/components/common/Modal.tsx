import React, { useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useDialogFocus } from '../../hooks/useDialogFocus';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '560px',
}) => {
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useDialogFocus(dialog, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <div>
            <h2 id={titleId} style={{ fontSize: '20px' }}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} style={{ fontSize: '13px', marginTop: '4px' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            aria-label="Close dialog"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
