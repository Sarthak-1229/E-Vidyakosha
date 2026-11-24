import React, { useEffect, useState } from 'react';
import {
  searchApprovedDocuments,
  updateDocumentMetadata,
  deleteDocument,
  listSubjects,
  getErrorMessage,
} from '../../api';
import type { DocumentDto, SubjectDto, DocumentType } from '../../api/types';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { TypeBadge } from '../../components/common/Badge';
import { Pagination } from '../../components/repository/Pagination';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  Edit2,
  Trash2,
  Search,
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
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const pageSize = 20;
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit metadata modal state
  const [editingDoc, setEditingDoc] = useState<DocumentDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editType, setEditType] = useState<DocumentType>('LECTURE_NOTES');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deletion state
  const [deletingDoc, setDeletingDoc] = useState<DocumentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    async function load() {
      try {
        const [response, courses] = await Promise.all([
          searchApprovedDocuments({ q: searchQuery, page, pageSize }), listSubjects(),
        ]);
        if (!active) return;
        setDocuments(response.items);
        setSubjects(courses);
        setTotal(response.total);
      } catch (cause) {
        if (active) setError(getErrorMessage(cause));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [page, refresh, searchQuery]);

  const openEditModal = (doc: DocumentDto) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditAuthor(doc.author || '');
    setEditType(doc.type);
    setEditSubjectId(doc.subjectId);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      await updateDocumentMetadata(editingDoc.id, {
        title: editTitle.trim(),
        author: editAuthor.trim() || null,
        type: editType,
        subjectId: editSubjectId,
      });

      setPage(1);
      setRefresh(value => value + 1);
      showToast('Document metadata updated successfully.', 'success');
      setEditingDoc(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deletingDoc.id);
      if (documents.length === 1 && page > 1) setPage(page - 1);
      setRefresh(value => value + 1);
      showToast('Document permanently removed from repository.', 'success');
      setDeletingDoc(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span className="eyebrow light">
          <span className="eyebrow-dot" /> Catalog Administration
        </span>
        <h1 style={{ color: '#ffffff', marginBottom: '6px' }}>Manage Approved Documents</h1>
        <p style={{ color: '#e2e8f0', fontSize: '14px' }}>
          Inspect repository documents, adjust metadata, and permanently remove deprecated records.
          Note: per academic security policy, document PDFs cannot be replaced in place.
        </p>
      </div>

      {error && <div><ErrorAlert message={error} /><button className="btn btn-secondary" onClick={() => setRefresh(value => value + 1)}>Retry</button></div>}

      {/* Search Bar */}
      <div style={{ marginBottom: '20px', maxWidth: '420px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--c-slate)" style={{ position: 'absolute', left: '14px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Filter by title?"
            aria-label="Filter approved documents by title"
            maxLength={250}
            className="form-input"
            style={{ paddingLeft: '40px', height: '42px', borderRadius: '9999px' }}
          />
        </div>
      </div>

      {error ? null : isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Spinner size={36} label="Loading documents..." />
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<FileSpreadsheet size={32} />}
            title="No Documents Found"
            description="No documents match your filter."
          />
        </div>
      ) : (
        <div className="table-wrapper" tabIndex={0} role="region" aria-label="Approved documents table">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Classification</th>
                <th>Course</th>
                <th>Author</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const sub = subjects.find((s) => s.id === doc.subjectId);
                const dateStr = new Date(doc.uploadedAt).toLocaleDateString();

                return (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600, maxWidth: '280px' }}>{doc.title}</td>
                    <td>
                      <TypeBadge type={doc.type} />
                    </td>
                    <td>{sub ? sub.name : 'Unknown Course'}</td>
                    <td>{doc.author || '—'}</td>
                    <td>{dateStr}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(doc)}
                          className="btn-ghost"
                          style={{ padding: '6px', color: 'var(--c-slate)' }}
                          title="Edit metadata"
                          aria-label={`Edit ${doc.title}`}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingDoc(doc)}
                          className="btn-ghost"
                          style={{ padding: '6px', color: '#dc2626' }}
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
        description="Update title, author, classification or course assignment. PDF content is locked."
      >
        <form onSubmit={handleSaveEdit}>
          <Input
            id="edit-title"
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />

          <Input
            id="edit-author"
            label="Author(s)"
            value={editAuthor}
            onChange={(e) => setEditAuthor(e.target.value)}
            placeholder="Optional"
          />

          <Select
            id="edit-type"
            label="Document Classification"
            value={editType}
            onChange={(e) => setEditType(e.target.value as DocumentType)}
            options={DOCUMENT_TYPES}
            required
          />

          <div className="form-group">
            <label htmlFor="edit-subject" className="form-label">
              Course / Subject <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="edit-subject"
              value={editSubjectId}
              onChange={(e) => setEditSubjectId(e.target.value)}
              className="form-select"
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
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
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleConfirmDelete}
        title="Permanently Delete Document"
        message={`Are you sure you want to permanently delete "${deletingDoc?.title}"? This action removes the document record and cleans up storage binaries.`}
        confirmLabel="Permanently Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
