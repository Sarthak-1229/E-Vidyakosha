import React, { useEffect, useState } from 'react';
import { listPendingApprovals, decideUpload, getErrorMessage } from '../../api';
import type { SubmissionDto, DecisionRequest } from '../../api/types';
import { DecisionModal } from '../../components/admin/DecisionModal';
import { TypeBadge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Calendar, User, CheckCircle2, Clock } from 'lucide-react';

export const ApprovalsQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const [pendingList, setPendingList] = useState<SubmissionDto[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPendingApprovals();
      setPendingList(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (!selectedSubmission) return;
    const req: DecisionRequest = {
      decision,
      ...(reason ? { reason } : {}),
    };
    await decideUpload(selectedSubmission.id, req);
    showToast(
      `Submission successfully ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`,
      'success'
    );
    // Remove decided item from pending queue atomically
    setPendingList((prev) => prev.filter((s) => s.id !== selectedSubmission.id));
    setIsModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span className="eyebrow light">
          <span className="eyebrow-dot" /> Administrative Governance
        </span>
        <h1 style={{ color: '#ffffff', marginBottom: '6px' }}>Review & Approvals Queue</h1>
        <p style={{ color: '#e2e8f0', fontSize: '14px' }}>
          Inspect submitted course materials. Approving adds the resource to the searchable
          catalog; rejecting requires a revision note for the instructor.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size={36} label="Loading pending review queue..." />
        </div>
      ) : pendingList.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<CheckCircle2 size={34} color="#059669" />}
            title="Review Queue is Clear"
            description="All faculty submissions have been evaluated. New pending submissions will appear here automatically."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingList.map((sub) => {
            const submittedDate = new Date(sub.submittedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sub.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '24px 28px',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
                data-testid={`pending-card-${sub.id}`}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-pending">
                      <Clock size={12} /> Pending Review
                    </span>
                    <TypeBadge type={sub.document.type} />
                  </div>

                  <h3 style={{ fontSize: '17px', color: 'var(--c-midnight)', marginBottom: '8px' }}>
                    {sub.document.title}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      fontSize: '12px',
                      color: 'var(--c-text-secondary)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {sub.document.author && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} /> Author: {sub.document.author}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} /> Submitted: {submittedDate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setIsModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                  data-testid={`review-btn-${sub.id}`}
                >
                  <ShieldCheck size={16} /> Review Submission
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Review Modal */}
      <DecisionModal
        submission={selectedSubmission}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubmission(null);
        }}
        onSubmit={handleDecision}
      />
    </div>
  );
};
