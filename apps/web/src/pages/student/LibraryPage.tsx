import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  searchApprovedDocuments,
  listDepartments,
  listSubjects,
  downloadDocument,
  getErrorMessage,
} from '../../api';
import type {
  DocumentDto,
  DepartmentDto,
  SubjectDto,
  DocumentType,
} from '../../api/types';
import { SearchBar } from '../../components/repository/SearchBar';
import { HierarchyFilter, DOCUMENT_TYPES_OPTIONS } from '../../components/repository/HierarchyFilter';
import { DocumentCard } from '../../components/repository/DocumentCard';
import { Pagination } from '../../components/repository/Pagination';
import { TypeBadge } from '../../components/common/Badge';
import { CardSkeleton, Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Building2,
  Download,
  FileCheck2,
  FolderSearch,
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);

  const query = searchParams.get('q') ?? '';
  const selectedDepartmentId = searchParams.get('dept') ?? '';
  const selectedSubjectId = searchParams.get('subject') ?? '';
  const selectedType = searchParams.get('type') ?? '';
  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = 12;

  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table',
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [totalItems, setTotalItems] = useState<number>(0);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (!val) next.delete(key);
      else next.set(key, val);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    async function loadHierarchy() {
      try {
        const [depts, subs] = await Promise.all([listDepartments(), listSubjects()]);
        if (!active) return;
        setDepartments(depts);
        setSubjects(subs);
      } catch (cause) {
        if (active) setHierarchyError(getErrorMessage(cause));
      }
    }
    void loadHierarchy();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    searchApprovedDocuments(
      {
        q: query,
        subjectId: selectedSubjectId,
        type: selectedType ? (selectedType as DocumentType) : undefined,
        page: currentPage,
        pageSize,
      },
      controller.signal,
    )
      .then(
        (response) => {
          if (controller.signal.aborted) return;
          setDocuments(response.items);
          setTotalItems(response.total);
        },
        (cause) => {
          if (!controller.signal.aborted) setError(getErrorMessage(cause));
        },
      )
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [query, selectedSubjectId, selectedType, currentPage, refresh]);

  const handleDepartmentChange = (deptId: string) => {
    updateParams({ dept: deptId || null, subject: null, page: null });
  };

  const handleSubjectChange = (subjId: string) => {
    const course = subjects.find((s) => s.id === subjId);
    updateParams({
      subject: subjId || null,
      dept: course ? course.departmentId : selectedDepartmentId || null,
      page: null,
    });
  };

  const handleTypeChange = (type: string) => {
    updateParams({ type: type || null, page: null });
  };

  const handleSearchChange = (val: string) => {
    updateParams({ q: val || null, page: null });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleDownloadRow = async (doc: DocumentDto) => {
    setDownloadingId(doc.id);
    try {
      await downloadDocument(doc.id, doc.title);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const deptSubjects = selectedDepartmentId
    ? subjects.filter((s) => s.departmentId === selectedDepartmentId)
    : [];
  const activeTypeLabel = DOCUMENT_TYPES_OPTIONS.find((t) => t.value === selectedType)?.label;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Approved Institutional Catalog
          </span>
          <h1>Academic Library</h1>
          <p className="page-header-subtitle">
            Browse faculty-verified lecture notes, lab manuals, reference books, and examination
            question banks organized by academic hierarchy.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={isLoading}
            aria-label="Refresh catalog"
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animate' : undefined} /> Refresh
          </button>

          <div className="segmented-control" role="group" aria-label="View layout">
            <button
              type="button"
              className={`segmented-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
            >
              <List size={14} /> Table
            </button>
            <button
              type="button"
              className={`segmented-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid size={14} /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="metrics-strip">
        <div className="metric-tile">
          <div>
            <div className="metric-label">Matching Resources</div>
            <div className="metric-value">{totalItems}</div>
          </div>
          <div className="metric-icon">
            <FileCheck2 size={18} />
          </div>
        </div>
        <div className="metric-tile">
          <div>
            <div className="metric-label">Departments</div>
            <div className="metric-value">{departments.length}</div>
          </div>
          <div className="metric-icon">
            <Building2 size={18} />
          </div>
        </div>
        <div className="metric-tile">
          <div>
            <div className="metric-label">Courses / Subjects</div>
            <div className="metric-value">{subjects.length}</div>
          </div>
          <div className="metric-icon">
            <BookOpen size={18} />
          </div>
        </div>
      </div>

      {hierarchyError && <ErrorAlert message={'Academic filters could not load. ' + hierarchyError} />}

      {/* Search & Hierarchy Filter Toolbar */}
      <div className="toolbar-panel">
        <SearchBar
          value={query}
          onChange={handleSearchChange}
          onSubmit={() => setRefresh((v) => v + 1)}
        />

        <HierarchyFilter
          departments={departments}
          subjects={subjects}
          selectedDepartmentId={selectedDepartmentId}
          selectedSubjectId={selectedSubjectId}
          selectedType={selectedType}
          onDepartmentChange={handleDepartmentChange}
          onSubjectChange={handleSubjectChange}
          onTypeChange={handleTypeChange}
          onReset={handleResetFilters}
        />

        {/* Quick Subject Selector when a Department is highlighted */}
        {activeDepartment && !selectedSubjectId && deptSubjects.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              paddingTop: '10px',
              borderTop: '1px solid var(--c-divider)',
              fontSize: '12px',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--c-text-secondary)', marginRight: '4px' }}>
              Courses in {activeDepartment.name}:
            </span>
            {deptSubjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                onClick={() => handleSubjectChange(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Meta & Active Filter Chips */}
      <div className="results-bar">
        <span role="status" style={{ fontSize: '13px', color: 'var(--c-text-secondary)', fontWeight: 600 }}>
          Showing <strong>{documents.length}</strong> of <strong>{totalItems}</strong> approved
          resource{totalItems === 1 ? '' : 's'}
        </span>

        {(query || activeDepartment || activeSubject || activeTypeLabel) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {query && (
              <span className="filter-chip">
                Query: “{query}”
                <button type="button" aria-label="Remove query filter" onClick={() => handleSearchChange('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {activeSubject && (
              <span className="filter-chip">
                Subject: {activeSubject.name}
                <button type="button" aria-label="Remove subject filter" onClick={() => handleSubjectChange('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {activeTypeLabel && selectedType && (
              <span className="filter-chip">
                Type: {activeTypeLabel}
                <button type="button" aria-label="Remove type filter" onClick={() => handleTypeChange('')}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Content */}
      {error ? (
        <div className="panel">
          <ErrorAlert message={error} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setRefresh((v) => v + 1)}>
            Retry search
          </button>
        </div>
      ) : isLoading ? (
        viewMode === 'table' ? (
          <div className="panel" style={{ padding: '40px 0', textAlign: 'center' }}>
            <Spinner size={28} label="Loading approved catalog..." />
          </div>
        ) : (
          <div className="doc-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )
      ) : documents.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<FolderSearch size={28} />}
            title="No Documents Found"
            description="No approved academic resources match your current search query and filters. Try adjusting your criteria or clearing filters."
            action={
              <button type="button" onClick={handleResetFilters} className="btn btn-secondary btn-sm">
                Clear all filters
              </button>
            }
          />
        </div>
      ) : viewMode === 'table' ? (
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Approved academic catalog table">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Classification</th>
                <th>Department / Subject</th>
                <th>Author</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const subject = subjects.find((s) => s.id === doc.subjectId);
                const department = subject
                  ? departments.find((d) => d.id === subject.departmentId)
                  : undefined;
                const dateStr = new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <tr key={doc.id} data-testid={`document-card-${doc.id}`}>
                    <td style={{ maxWidth: '300px' }}>
                      <Link to={`/library/${doc.id}`} className="table-doc-link" title={doc.title}>
                        {doc.title}
                      </Link>
                    </td>
                    <td>
                      <TypeBadge type={doc.type} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--c-ink)', fontSize: '12.5px' }}>
                        {subject ? subject.name : '—'}
                      </div>
                      {department && (
                        <div style={{ fontSize: '11.5px', color: 'var(--c-text-muted)' }}>
                          {department.name}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--c-text-secondary)' }}>{doc.author || '—'}</td>
                    <td style={{ color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link to={`/library/${doc.id}`} className="btn btn-secondary btn-sm">
                          <BookOpen size={13} /> Read Online
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownloadRow(doc)}
                          disabled={downloadingId === doc.id}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 9px' }}
                          title="Download PDF"
                          aria-label={`Download ${doc.title}`}
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 size={14} className="spin-animate" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="doc-grid">
          {documents.map((doc) => {
            const subject = subjects.find((s) => s.id === doc.subjectId);
            const department = subject
              ? departments.find((d) => d.id === subject.departmentId)
              : undefined;
            return (
              <DocumentCard
                key={doc.id}
                document={doc}
                subject={subject}
                department={department}
              />
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={(p) => updateParams({ page: p > 1 ? String(p) : null })}
      />
    </div>
  );
};
