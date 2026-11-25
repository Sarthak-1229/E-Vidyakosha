import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listOwnSubmissions,
  listDepartments,
  listSubjects,
  getErrorMessage,
} from '../../api';
import type { SubmissionDto, DepartmentDto, SubjectDto } from '../../api/types';
import { StatusBadge, TypeBadge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  Upload,
  FileText,
  MessageSquareWarning,
  RefreshCw,
} from 'lucide-react';

export const FacultySubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadSubmissions() {
      setIsLoading(true);
      setError(null);
      try {
        const [data, depts, subs] = await Promise.all([
          listOwnSubmissions(),
          listDepartments(),
          listSubjects(),
        ]);
        if (!active) return;
        setSubmissions(data);
        setDepartments(depts);
        setSubjects(subs);
      } catch (err: unknown) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadSubmissions();
    return () => {
      active = false;
    };
  }, [refresh]);

  const filtered = submissions.filter((sub) => {
    if (filterStatus !== 'ALL' && sub.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      return sub.document.title.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const rejectedCount = submissions.filter((s) => s.status === 'REJECTED').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Faculty Contributions</span>
          <h1>My Submissions</h1>
          <p className="page-header-subtitle">
            Review administrative approval outcomes and revision notes for your uploaded PDFs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animate' : undefined} /> Refresh
          </button>
          <Link to="/faculty/upload" className="btn btn-primary btn-sm">
            <Upload size={14} /> Upload New Material
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
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
        <div className="segmented-control" role="tablist" aria-label="Submission status filter">
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'ALL'}
            onClick={() => setFilterStatus('ALL')}
            className={`segmented-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          >
            All ({submissions.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'PENDING'}
            onClick={() => setFilterStatus('PENDING')}
            className={`segmented-btn ${filterStatus === 'PENDING' ? 'active' : ''}`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'APPROVED'}
            onClick={() => setFilterStatus('APPROVED')}
            className={`segmented-btn ${filterStatus === 'APPROVED' ? 'active' : ''}`}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterStatus === 'REJECTED'}
            onClick={() => setFilterStatus('REJECTED')}
            className={`segmented-btn ${filterStatus === 'REJECTED' ? 'active' : ''}`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        <input
          type="search"
          aria-label="Filter submissions by title"
          placeholder="Filter your submissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ width: 'min(100%, 260px)', height: '36px' }}
        />
      </div>

      {error && <ErrorAlert message={error} />}

      {isLoading ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spinner size={28} label="Loading your submissions..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<FileText size={28} />}
            title={
              filterStatus === 'ALL' && !searchTerm
                ? 'No Submissions Yet'
                : `No matching ${filterStatus === 'ALL' ? '' : filterStatus.toLowerCase() + ' '}submissions`
            }
            description={
              filterStatus === 'ALL' && !searchTerm
                ? 'You have not uploaded any academic materials yet. Start contributing to make knowledge accessible.'
                : 'No submissions match your active filter criteria.'
            }
            action={
              filterStatus === 'ALL' && !searchTerm ? (
                <Link to="/faculty/upload" className="btn btn-primary btn-sm">
                  <Upload size={14} /> Upload First Document
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setFilterStatus('ALL');
                    setSearchTerm('');
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((sub) => {
            const subject = subjects.find((s) => s.id === sub.document.subjectId);
            const department = subject
              ? departments.find((d) => d.id === subject.departmentId)
              : undefined;
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
                className="docket-card"
                style={{ padding: '18px 20px' }}
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
                  <div style={{ flex: 1, minWidth: 'min(100%, 280px)' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '8px',
                      }}
                    >
                      <StatusBadge status={sub.status} />
                      <TypeBadge type={sub.document.type} />
                      {subject && (
                        <span style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontWeight: 500 }}>
                          {department ? `${department.name} · ` : ''}
                          {subject.name}
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
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {sub.document.author && (
                        <span>
                          Author: <strong>{sub.document.author}</strong>
                        </span>
                      )}
                      <span title={`Submission ID: ${sub.id}`}>ID: #{sub.id.slice(-8)}</span>
                      <span>Submitted: {submittedDate}</span>
                      {reviewedDate && <span>Reviewed: {reviewedDate}</span>}
                    </div>
                  </div>

                  {sub.status === 'APPROVED' && (
                    <Link to={`/library/${sub.document.id}`} className="btn btn-secondary btn-sm">
                      View in Library
                    </Link>
                  )}
                </div>

                {sub.status === 'REJECTED' && sub.rejectionReason && (
                  <div
                    className="alert alert-error"
                    style={{ marginTop: '14px', marginBottom: 0 }}
                    data-testid="rejection-reason"
                  >
                    <MessageSquareWarning size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>Rejection reason</div>
                      <div>{sub.rejectionReason}</div>
                    </div>
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
