import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  searchDocumentsInScope,
  updateDocumentMetadata,
  deleteDocument,
  listDepartments,
  listSubjects,
  getErrorMessage,
} from '../../api';
import type { DocumentDto, DepartmentDto, SubjectDto, DocumentType } from '../../api/types';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { TypeBadge } from '../../components/common/Badge';
import { Pagination } from '../../components/repository/Pagination';
import { DOCUMENT_TYPES_OPTIONS } from '../../components/repository/HierarchyFilter';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import { validateAuthorInput, validateTitleInput } from '../../lib/validation';
import {
  FileSpreadsheet,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  RotateCcw,
  Lock,
} from 'lucide-react';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'LECTURE_NOTES', label: 'Lecture Notes' },
  { value: 'LAB_MANUAL', label: 'Lab Manual' },
  { value: 'REFERENCE_BOOK', label: 'Reference Book' },
  { value: 'RESEARCH_PAPER', label: 'Research Paper' },
  { value: 'QUESTION_PAPER', label: 'Question Paper' },
  { value: 'EBOOK', label: 'eBook' },
  { value: 'OTHER', label: 'Other Material' },
];

export const DocumentManagementPage: React.FC = () => {
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDeptId, setFilterDeptId] = useState<string>('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit metadata modal state
  const [editingDoc, setEditingDoc] = useState<DocumentDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editType, setEditType] = useState<DocumentType>('LECTURE_NOTES');
  const [editDeptId, setEditDeptId] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editTitleError, setEditTitleError] = useState<string | undefined>();
  const [editAuthorError, setEditAuthorError] = useState<string | undefined>();
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deletion state
  const [deletingDoc, setDeletingDoc] = useState<DocumentDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoadingHierarchy(true);
    Promise.all([listDepartments(), listSubjects()])
      .then(([depts, courses]) => {
        if (!active) return;
        setDepartments(depts);
        setSubjects(courses);
      })
      .catch(() => {
        // Hierarchy load failures still allow catalog operations; list load reports primary error.
      })
      .finally(() => {
        if (active) setIsLoadingHierarchy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const departmentScopeKey =
    filterDeptId && !filterSubjectId
      ? isLoadingHierarchy
        ? 'LOADING'
        : subjects
            .filter((s) => s.departmentId === filterDeptId)
            .map((s) => s.id)
            .join(',')
      : '';

  useEffect(() => {
    if (departmentScopeKey === 'LOADING') {
      setIsLoading(true);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    searchDocumentsInScope(
      {
        q: searchQuery,
        subjectId: filterSubjectId || undefined,
        type: filterType ? (filterType as DocumentType) : undefined,
        page,
        pageSize,
      },
      filterDeptId || undefined,
      subjects,
      controller.signal,
    )
      .then(
        (response) => {
          if (controller.signal.aborted) return;
          setDocuments(response.items);
          setTotal(response.total);
        },
        (cause) => {
          if (!controller.signal.aborted) setError(getErrorMessage(cause));
        },
      )
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [page, refresh, searchQuery, filterDeptId, filterSubjectId, filterType, departmentScopeKey]);

  const openEditModal = (doc: DocumentDto) => {
    const subj = subjects.find((s) => s.id === doc.subjectId);
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditAuthor(doc.author || '');
    setEditType(doc.type);
    setEditDeptId(subj?.departmentId ?? departments[0]?.id ?? '');
    setEditSubjectId(doc.subjectId);
    setEditError(null);
    setEditTitleError(undefined);
    setEditAuthorError(undefined);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const tErr = validateTitleInput(editTitle);
    const aErr = validateAuthorInput(editAuthor);
    setEditTitleError(tErr ?? undefined);
    setEditAuthorError(aErr ?? undefined);
    setEditError(null);
    if (tErr || aErr || !editSubjectId) {
      if (!editSubjectId) setEditError('Please choose a valid subject.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await updateDocumentMetadata(editingDoc.id, {
        title: editTitle.trim(),
        author: editAuthor.trim() || null,
        type: editType,
        subjectId: editSubjectId,
      });

      setPage(1);
      setRefresh((value) => value + 1);
      showToast('Document metadata updated successfully.', 'success');
      setEditingDoc(null);
    } catch (err: unknown) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocument(deletingDoc.id);
      if (documents.length === 1 && page > 1) setPage(page - 1);
      setRefresh((value) => value + 1);
      showToast('Document permanently removed from repository.', 'success');
      setDeletingDoc(null);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const filterSubjectsList = filterDeptId
    ? subjects.filter((s) => s.departmentId === filterDeptId)
    : subjects;
  const editSubjectsList = editDeptId
    ? subjects.filter((s) => s.departmentId === editDeptId)
    : subjects;
  const hasFilters = Boolean(searchQuery || filterDeptId || filterSubjectId || filterType);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Catalog Administration
          </span>
          <h1>Manage Approved Documents</h1>
          <p className="page-header-subtitle">
            Edit catalog metadata, adjust course assignments, or permanently remove deprecated
            records. PDF binaries remain immutable per institutional integrity rules.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorAlert message={error} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRefresh((v) => v + 1)}>
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="toolbar-panel">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <div>
            <label
              htmlFor="admin-doc-search"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--c-text-secondary)' }}
            >
              Title Search
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} color="var(--c-text-muted)" style={{ position: 'absolute', left: '11px' }} />
              <input
                id="admin-doc-search"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search approved documents..."
                aria-label="Filter approved documents by title"
                maxLength={250}
                className="form-input"
                style={{ paddingLeft: '34px', height: '38px', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-doc-dept"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--c-text-secondary)' }}
            >
              Department
            </label>
            <select
              id="admin-doc-dept"
              value={filterDeptId}
              onChange={(e) => {
                setFilterDeptId(e.target.value);
                setFilterSubjectId('');
                setPage(1);
              }}
              className="form-select"
              style={{ height: '38px', fontSize: '13px' }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-doc-subj"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--c-text-secondary)' }}
            >
              Subject / Course
            </label>
            <select
              id="admin-doc-subj"
              value={filterSubjectId}
              onChange={(e) => {
                setFilterSubjectId(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ height: '38px', fontSize: '13px' }}
            >
              <option value="">{filterDeptId ? 'All in Department' : 'All Subjects'}</option>
              {filterSubjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-doc-type"
              style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--c-text-secondary)' }}
            >
              Classification
            </label>
            <select
              id="admin-doc-type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ height: '38px', fontSize: '13px' }}
            >
              {DOCUMENT_TYPES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ height: '38px', width: '100%' }}
                onClick={() => {
                  setSearchQuery('');
                  setFilterDeptId('');
                  setFilterSubjectId('');
                  setFilterType('');
                  setPage(1);
                }}
              >
                <RotateCcw size={13} /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? null : isLoading ? (
        <div className="panel" style={{ padding: '48px 0', textAlign: 'center' }}>
          <Spinner size={28} label="Loading approved documents..." />
        </div>
      ) : documents.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={<FileSpreadsheet size={28} />}
            title="No Documents Found"
            description="No approved catalog documents match your current search criteria."
            action={
              hasFilters ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterDeptId('');
                    setFilterSubjectId('');
                    setFilterType('');
                    setPage(1);
                  }}
                >
                  Reset filters
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Approved documents table">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Classification</th>
                <th>Department &amp; Course</th>
                <th>Author</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const sub = subjects.find((s) => s.id === doc.subjectId);
                const dept = sub ? departments.find((d) => d.id === sub.departmentId) : undefined;
                const dateStr = new Date(doc.uploadedAt).toLocaleDateString();

                return (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600, maxWidth: '280px' }}>{doc.title}</td>
                    <td>
                      <TypeBadge type={doc.type} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                        {sub ? sub.name : 'Unknown Course'}
                      </div>
                      {dept && (
                        <div style={{ fontSize: '11.5px', color: 'var(--c-text-muted)' }}>{dept.name}</div>
                      )}
                    </td>
                    <td>{doc.author || '—'}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{dateStr}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <Link
                          to={`/library/${doc.id}`}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '4px', color: 'var(--c-accent)' }}
                          title="Open PDF viewer"
                          aria-label={`View ${doc.title}`}
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '4px', color: 'var(--c-text-secondary)' }}
                          title="Edit metadata"
                          aria-label={`Edit ${doc.title}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingDoc(doc);
                          }}
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '4px', color: 'var(--c-danger)' }}
                          title="Delete document"
                          aria-label={`Delete ${doc.title}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!error && <Pagination currentPage={page} totalItems={total} pageSize={pageSize} onPageChange={setPage} />}

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        title="Edit Document Metadata"
        description="Update title, author, classification, or subject assignment."
      >
        <form onSubmit={handleSaveEdit} noValidate>
          {editError && <ErrorAlert message={editError} />}

          <div className="alert alert-info" style={{ marginBottom: '16px', padding: '10px 12px', fontSize: '12px' }}>
            <Lock size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>PDF binary content cannot be replaced in place per SRS FR-06.</span>
          </div>

          <Input
            id="edit-title"
            label="Title"
            maxLength={500}
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              if (editTitleError) setEditTitleError(undefined);
            }}
            required
            error={editTitleError}
          />

          <Input
            id="edit-author"
            label="Author(s)"
            maxLength={250}
            value={editAuthor}
            onChange={(e) => {
              setEditAuthor(e.target.value);
              if (editAuthorError) setEditAuthorError(undefined);
            }}
            placeholder="Optional"
            error={editAuthorError}
          />

          <Select
            id="edit-type"
            label="Document Classification"
            value={editType}
            onChange={(e) => setEditType(e.target.value as DocumentType)}
            options={DOCUMENT_TYPES}
            required
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '12px',
            }}
          >
            <div className="form-group">
              <label htmlFor="edit-department" className="form-label">
                Department
              </label>
              <select
                id="edit-department"
                value={editDeptId}
                onChange={(e) => {
                  const deptId = e.target.value;
                  setEditDeptId(deptId);
                  setEditSubjectId(subjects.find((s) => s.departmentId === deptId)?.id ?? '');
                }}
                className="form-select"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-subject" className="form-label">
                <span>
                  Course / Subject <span style={{ color: 'var(--c-danger)' }}>*</span>
                </span>
              </label>
              <select
                id="edit-subject"
                value={editSubjectId}
                onChange={(e) => setEditSubjectId(e.target.value)}
                className="form-select"
                required
              >
                {editSubjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '18px -22px -16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingDoc(null)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingEdit}>
              Save Metadata
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Permanent Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDoc}
        onClose={() => {
          setDeletingDoc(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Document"
        message={`Are you sure you want to permanently delete "${deletingDoc?.title}"? This removes the document record and cleans up stored GridFS binaries.`}
        confirmLabel="Permanently Delete"
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};
