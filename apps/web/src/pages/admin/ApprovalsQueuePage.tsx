import React, { useEffect, useState } from 'react';
import {
  listPendingApprovals,
  decideUpload,
  listDepartments,
  listSubjects,
  getErrorMessage,
} from '../../api';
import type { SubmissionDto, DecisionRequest, DepartmentDto, SubjectDto } from '../../api/types';
import { DecisionModal } from '../../components/admin/DecisionModal';
import { TypeBadge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Calendar, User, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export const ApprovalsQueuePage: React.FC = () => {
  const { showToast } = useToast();
  const [pendingList, setPendingList] = useState<SubmissionDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, depts, subs] = await Promise.all([
        listPendingApprovals(),
        listDepartments(),
        listSubjects(),
      ]);
      setPendingList(data);
      setDepartments(depts);
      setSubjects(subs);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
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
      'success',
    );
    setPendingList((prev) => prev.filter((s) => s.id !== selectedSubmission.id));
    setIsModalOpen(false);
  };

  const resolveHierarchy = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    const department = subject ? departments.find((d) => d.id === subject.departmentId) : undefined;
    return { subjectName: subject?.name, departmentName: department?.name };
  };

  const filtered = pendingList.filter((sub) =>
    searchTerm.trim()
      ? sub.document.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
      : true,
  );

  const selectedHierarchy = selectedSubmission
    ? resolveHierarchy(selectedSubmission.document.subjectId)
    : { subjectName: undefined, departmentName: undefined };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Administrative Governance
          </span>
          <h1>Review &amp; Approvals Queue</h1>
          <p className="page-header-subtitle">
            Inspect pending faculty metadata submissions. Approved resources publish immediately to
            the repository; rejections require revision notes for the faculty author.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void loadPending()}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'spin-animate' : undefined} /> Refresh Queue
        </button>
      </div>

      {/* Summary & Search Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div className="badge badge-pending" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
          <Clock size={14} /> {pendingList.length} pending submission
          {pendingList.length === 1 ? '' : 's'}
        </div>

        <input
          type="search"
          aria-label="Filter pending submissions by title"
          placeholder="Filter pending titles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ width: 'min(100%, 280px)', height: '36px' }}
        />
      </div>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorAlert message={error} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void loadPending()}>
            Retry loading queue
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spinner size={28} label="Loading pending review queue..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<CheckCircle2 size={28} color="var(--c-success-icon)" />}
            title={pendingList.length === 0 ? 'Review Queue is Clear' : 'No Matching Pending Items'}
            description={
              pendingList.length === 0
                ? 'All faculty submissions have been evaluated. New pending submissions will appear here.'
                : 'Try adjusting your title filter to see pending items.'
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((sub) => {
            const { subjectName, departmentName } = resolveHierarchy(sub.document.subjectId);
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
                className="panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '18px 22px',
                  gap: '18px',
                  flexWrap: 'wrap',
                }}
                data-testid={`pending-card-${sub.id}`}
              >
                <div style={{ flex: 1, minWidth: 'min(100%, 280px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-pending">
                      <Clock size={12} /> Pending Review
                    </span>
                    <TypeBadge type={sub.document.type} />
                    {(departmentName || subjectName) && (
                      <span style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontWeight: 500 }}>
                        {departmentName ? `${departmentName} · ` : ''}
                        {subjectName ?? ''}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>{sub.document.title}</h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '12.5px',
                      color: 'var(--c-text-muted)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {sub.document.author && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={13} /> Author: <strong>{sub.document.author}</strong>
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontVariantNumeric: 'tabular-nums' }}>
                      <Calendar size={13} /> Submitted: {submittedDate}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubmission(sub);
                    setIsModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                  data-testid={`review-btn-${sub.id}`}
                >
                  <ShieldCheck size={15} /> Review Submission
                </button>
              </div>
            );
          })}
        </div>
      )}

      <DecisionModal
        key={selectedSubmission?.id ?? 'closed'}
        submission={selectedSubmission}
        subjectName={selectedHierarchy.subjectName}
        departmentName={selectedHierarchy.departmentName}
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
