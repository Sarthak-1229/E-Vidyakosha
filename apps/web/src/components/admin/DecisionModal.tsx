import React, { useState } from 'react';
import type { SubmissionDto } from '../../api/types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ErrorAlert } from '../common/ErrorAlert';
import { TypeBadge } from '../common/Badge';
import { getErrorMessage } from '../../api';
import { validateRejectionReason } from '../../lib/validation';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface DecisionModalProps {
  submission: SubmissionDto | null;
  subjectName?: string | undefined;
  departmentName?: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  submission,
  subjectName,
  departmentName,
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

    if (decision === 'REJECTED') {
      const rErr = validateRejectionReason(reason);
      if (rErr) {
        setReasonError(rErr);
        return;
      }
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
      description="Inspect submission metadata and record an atomic final decision."
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <ErrorAlert message={serverError} />}

        <div
          style={{
            padding: '14px 16px',
            background: 'var(--c-surface-subtle)',
            border: '1px solid var(--c-border)',
            borderRadius: '6px',
            marginBottom: '18px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <TypeBadge type={submission.document.type} />
            {(departmentName || subjectName) && (
              <span style={{ fontSize: '12px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>
                {departmentName ? `${departmentName} · ` : ''}
                {subjectName ?? ''}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--c-ink)', marginBottom: '6px' }}>
            {submission.document.title}
          </div>
          <div style={{ color: 'var(--c-text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px' }}>
            {submission.document.author && (
              <span>
                Author: <strong>{submission.document.author}</strong>
              </span>
            )}
            <span>
              Submitted: <strong>{new Date(submission.submittedAt).toLocaleString()}</strong>
            </span>
          </div>
        </div>

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
          <Info size={14} color="var(--c-accent)" />
          <span>Metadata review policy (SRS D-01): unapproved binaries remain isolated until approved.</span>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
            <span>
              Review Decision <span style={{ color: 'var(--c-danger)' }}>*</span>
            </span>
          </label>
          <div
            role="group"
            aria-label="Review decision"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 165px), 1fr))',
              gap: '10px',
            }}
          >
            <button
              type="button"
              aria-pressed={decision === 'APPROVED'}
              onClick={() => {
                setDecision('APPROVED');
                setReasonError(null);
              }}
              className={`btn ${decision === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                background: decision === 'APPROVED' ? '#15803d' : undefined,
                borderColor: decision === 'APPROVED' ? '#15803d' : undefined,
              }}
            >
              <CheckCircle2 size={15} /> Approve Resource
            </button>

            <button
              type="button"
              aria-pressed={decision === 'REJECTED'}
              onClick={() => setDecision('REJECTED')}
              className={`btn ${decision === 'REJECTED' ? 'btn-danger' : 'btn-secondary'}`}
            >
              <XCircle size={15} /> Reject Resource
            </button>
          </div>
        </div>

        {decision === 'REJECTED' && (
          <div className="form-group">
            <label htmlFor="rejection-reason" className="form-label">
              <span>
                Reason for Rejection <span style={{ color: 'var(--c-danger)' }}>*</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--c-text-muted)', fontWeight: 500 }}>
                {reason.length}/2000
              </span>
            </label>
            <textarea
              id="rejection-reason"
              rows={4}
              maxLength={2000}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? 'rejection-reason-error' : undefined}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder="Explain why the submission is rejected (e.g. illegible scan, incorrect subject, formatting guidelines)..."
              className={`form-textarea ${reasonError ? 'has-error' : ''}`}
              required
            />
            {reasonError && (
              <span id="rejection-reason-error" role="alert" className="form-error-text">
                <AlertTriangle size={13} /> {reasonError}
              </span>
            )}
          </div>
        )}

        <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
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
