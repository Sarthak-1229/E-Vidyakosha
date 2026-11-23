import React, { useState } from 'react';
import type { SubmissionDto } from '../../api/types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorAlert } from '../common/ErrorAlert';
import { getErrorMessage } from '../../api';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface DecisionModalProps {
  submission: SubmissionDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  submission,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reason, setReason] = useState<string>('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (!submission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReasonError(null);
    setServerError(null);

    // FR-05: Rejection requires non-empty reason
    if (decision === 'REJECTED' && !reason.trim()) {
      setReasonError('A clear rejection reason is required so the faculty member can revise.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(decision, decision === 'REJECTED' ? reason.trim() : undefined);
      onClose();
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Academic Submission"
      description={`Assess document quality and approve or reject with feedback.`}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        {/* Submission Details Summary */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(234, 240, 246, 0.6)',
            borderRadius: '16px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--c-midnight)', marginBottom: '6px' }}>
            {submission.document.title}
          </div>
          <div style={{ color: 'var(--c-text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>Type: <strong>{submission.document.type}</strong></span>
            {submission.document.author && <span>Author: <strong>{submission.document.author}</strong></span>}
          </div>
        </div>

        {/* Decision Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
            Review Decision <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setDecision('APPROVED');
                setReasonError(null);
              }}
              className={`btn ${
                decision === 'APPROVED' ? 'btn-primary' : 'btn-secondary'
              }`}
              style={{
                background:
                  decision === 'APPROVED'
                    ? '#059669'
                    : 'rgba(255, 255, 255, 0.6)',
                borderColor: decision === 'APPROVED' ? '#059669' : 'var(--c-glass-border)',
                color: decision === 'APPROVED' ? '#ffffff' : 'var(--c-text-primary)',
              }}
            >
              <CheckCircle2 size={16} /> Approve Resource
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECTED')}
              className={`btn ${
                decision === 'REJECTED' ? 'btn-danger' : 'btn-secondary'
              }`}
            >
              <XCircle size={16} /> Request Revisions
            </button>
          </div>
        </div>

        {/* Rejection Reason Input (Mandatory when REJECTED) */}
        {decision === 'REJECTED' && (
          <div className="form-group">
            <label htmlFor="rejection-reason" className="form-label">
              <span>
                Reason for Rejection / Revision Details <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </label>
            <textarea
              id="rejection-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the submission is rejected (e.g. illegible scan, incorrect subject, formatting guidelines)..."
              className={`form-textarea ${reasonError ? 'has-error' : ''}`}
              required
            />
            {reasonError && (
              <span className="form-error-text" style={{ marginTop: '4px' }}>
                <AlertTriangle size={13} /> {reasonError}
              </span>
            )}
          </div>
        )}

        <div className="modal-footer">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={decision === 'APPROVED' ? 'primary' : 'danger'}
            isLoading={isSubmitting}
          >
            Confirm {decision === 'APPROVED' ? 'Approval' : 'Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
