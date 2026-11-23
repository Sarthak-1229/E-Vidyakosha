import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOwnSubmissions, getErrorMessage } from '../../api';
import type { SubmissionDto } from '../../api/types';
import { StatusBadge, TypeBadge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  MessageSquareWarning,
} from 'lucide-react';

export const FacultySubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listOwnSubmissions();
        setSubmissions(data);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  const filtered = submissions.filter((sub) => {
    if (filterStatus === 'ALL') return true;
    return sub.status === filterStatus;
  });

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const rejectedCount = submissions.filter((s) => s.status === 'REJECTED').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span className="eyebrow light">
            <span className="eyebrow-dot" /> Faculty Contributions
          </span>
          <h1 style={{ color: '#ffffff', marginBottom: '6px' }}>My Submissions</h1>
          <p style={{ color: '#e2e8f0', fontSize: '14px' }}>
            Track review status and administrative feedback for your contributed academic materials.
          </p>
        </div>

        <Link to="/faculty/upload" className="btn btn-primary">
          <Upload size={16} /> Upload New Material
        </Link>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setFilterStatus('PENDING')}
          className={`btn btn-sm ${filterStatus === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Clock size={14} /> Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilterStatus('APPROVED')}
          className={`btn btn-sm ${filterStatus === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <CheckCircle2 size={14} /> Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilterStatus('REJECTED')}
          className={`btn btn-sm ${filterStatus === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <XCircle size={14} /> Needs Revision ({rejectedCount})
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size={36} label="Loading your submissions..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<FileText size={32} />}
            title={
              filterStatus === 'ALL'
                ? 'No Submissions Yet'
                : `No ${filterStatus.toLowerCase()} submissions`
            }
            description={
              filterStatus === 'ALL'
                ? 'You have not uploaded any academic materials yet. Start contributing to make knowledge accessible.'
                : 'There are no submissions currently matching this status filter.'
            }
            action={
              <Link to="/faculty/upload" className="btn btn-primary btn-sm">
                <Upload size={14} /> Upload First Document
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((sub) => {
            const submittedDate = new Date(sub.submittedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const reviewedDate = sub.reviewedAt
              ? new Date(sub.reviewedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <div
                key={sub.id}
                className="glass-card"
                style={{ padding: '24px 28px' }}
                data-testid={`submission-card-${sub.id}`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <StatusBadge status={sub.status} />
                      <TypeBadge type={sub.document.type} />
                    </div>

                    <h3 style={{ fontSize: '18px', color: 'var(--c-midnight)', marginBottom: '8px' }}>
                      {sub.document.title}
                    </h3>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        fontSize: '12px',
                        color: 'var(--c-text-secondary)',
                        flexWrap: 'wrap',
                      }}
                    >
                      {sub.document.author && (
                        <span>
                          Author: <strong>{sub.document.author}</strong>
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={13} /> Submitted: {submittedDate}
                      </span>
                      {reviewedDate && <span>Reviewed: {reviewedDate}</span>}
                    </div>
                  </div>

                  {sub.status === 'APPROVED' && (
                    <Link
                      to={`/library/${sub.document.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View in Library
                    </Link>
                  )}
                </div>

                {/* FR-08: Explicit Rejection Reason callout */}
                {sub.status === 'REJECTED' && sub.rejectionReason && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#991b1b',
                      fontSize: '13px',
                    }}
                    data-testid="rejection-reason"
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        fontWeight: 700,
                        marginBottom: '4px',
                      }}
                    >
                      <MessageSquareWarning size={16} /> Reviewer Feedback & Revision Required:
                    </div>
                    <div>{sub.rejectionReason}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
