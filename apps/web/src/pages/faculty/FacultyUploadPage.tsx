import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPdf, listDepartments, listSubjects, getErrorMessage } from '../../api';
import type { DepartmentDto, SubjectDto, DocumentType, SubmitPdfParams } from '../../api/types';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { Spinner } from '../../components/common/Spinner';
import {
  formatFileSize,
  validateAuthorInput,
  validatePdfFileSync,
  validateTitleInput,
  verifyPdfBinaryStructure,
  type PdfPrecheckResult,
} from '../../lib/validation';
import {
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'LECTURE_NOTES', label: 'Lecture Notes' },
  { value: 'LAB_MANUAL', label: 'Lab Manual' },
  { value: 'REFERENCE_BOOK', label: 'Reference Book' },
  { value: 'RESEARCH_PAPER', label: 'Research Paper' },
  { value: 'QUESTION_PAPER', label: 'Question Paper' },
  { value: 'EBOOK', label: 'eBook' },
  { value: 'OTHER', label: 'Other Academic Material' },
];

export const FacultyUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [precheck, setPrecheck] = useState<PdfPrecheckResult | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<DocumentType>('LECTURE_NOTES');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [authorError, setAuthorError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);
  const [hierarchyRefresh, setHierarchyRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadingHierarchy(true);
    setHierarchyError(null);
    async function loadHierarchy() {
      try {
        const [depts, subs] = await Promise.all([listDepartments(), listSubjects()]);
        if (!active) return;
        setDepartments(depts);
        setSubjects(subs);
        const firstDept = depts.find((d) => subs.some((s) => s.departmentId === d.id)) ?? depts[0];
        const deptId = firstDept?.id ?? '';
        setSelectedDeptId(deptId);
        setSelectedSubjectId(subs.find((item) => item.departmentId === deptId)?.id ?? '');
      } catch (cause) {
        if (active) setHierarchyError(getErrorMessage(cause));
      } finally {
        if (active) setLoadingHierarchy(false);
      }
    }
    void loadHierarchy();
    return () => {
      active = false;
    };
  }, [hierarchyRefresh]);

  const filteredSubjects = selectedDeptId
    ? subjects.filter((s) => s.departmentId === selectedDeptId)
    : subjects;

  const processSelectedFile = async (selected: File) => {
    setFileError(null);
    const syncCheck = validatePdfFileSync(selected);
    setPrecheck(syncCheck);

    if (!syncCheck.valid) {
      setFile(null);
      setFileError(syncCheck.error ?? 'Invalid PDF file.');
      return;
    }

    const binaryCheck = await verifyPdfBinaryStructure(selected);
    setPrecheck(binaryCheck);
    if (!binaryCheck.valid) {
      setFile(null);
      setFileError(binaryCheck.error ?? 'PDF readability verification failed.');
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').slice(0, 500));
      setTitleError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      void processSelectedFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      void processSelectedFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const tErr = validateTitleInput(title);
    const aErr = validateAuthorInput(author);
    const fErr = !file ? fileError || 'Please select a valid PDF file.' : null;
    const sErr = !selectedSubjectId ? 'Please select a course subject.' : null;

    setFileError(fErr);
    setTitleError(tErr);
    setAuthorError(aErr);
    setSubjectError(sErr);

    if (fErr || tErr || aErr || sErr || !file) return;

    setIsSubmitting(true);
    try {
      const params: SubmitPdfParams = {
        file,
        title: title.trim(),
        type,
        subjectId: selectedSubjectId,
        ...(author.trim() ? { author: author.trim() } : {}),
      };

      const result = await submitPdf(params);
      showToast(
        `Submitted as ${result.status} (ID: ${result.submissionId}). Queued for admin review.`,
        'success',
      );
      navigate('/faculty/submissions');
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">Faculty Contribution Portal</span>
          <h1>Upload Academic Resource</h1>
          <p className="page-header-subtitle">
            Submit lecture notes, lab manuals, and reference texts. Uploaded PDFs are checked for
            structure, encryption, and SHA-256 uniqueness before entering the review queue.
          </p>
        </div>
      </div>

      <div className="panel">
        {serverError && <ErrorAlert message={serverError} />}

        <form onSubmit={handleSubmit} noValidate>
          {/* PDF Upload Dropzone */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Academic PDF Document <span style={{ color: 'var(--c-danger)' }}>*</span>
            </label>

            {!file ? (
              <div
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${
                  fileError ? 'has-error' : ''
                }`}
              >
                <input
                  id="pdf-file-input"
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                  tabIndex={-1}
                  aria-describedby="pdf-file-help"
                />
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '6px',
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 12px',
                    color: 'var(--c-accent)',
                  }}
                >
                  <UploadCloud size={22} />
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--c-ink)', marginBottom: '8px' }}>
                  Drag and drop your PDF here, or click to select
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInput.current?.click();
                  }}
                >
                  Browse for a PDF
                </button>
                <div id="pdf-file-help" style={{ fontSize: '12px', color: 'var(--c-text-muted)', marginTop: '8px' }}>
                  Maximum size: 50 MiB · Readable, unencrypted PDF documents only
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  background: 'var(--c-surface-subtle)',
                  border: '1px solid var(--c-accent-border)',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '4px',
                      background: 'var(--c-accent-tint)',
                      color: 'var(--c-accent)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '13.5px',
                        color: 'var(--c-ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>
                      {formatFileSize(file.size)} · Ready for submission
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPrecheck(null);
                    if (fileInput.current) fileInput.current.value = '';
                  }}
                  className="btn-ghost"
                  aria-label="Remove selected file"
                  style={{ padding: '6px', borderRadius: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {precheck && (
              <div className="validation-checklist" aria-label="PDF validation status">
                <span className={`validation-check-item ${precheck.checks.format ? 'ok' : 'fail'}`}>
                  <CheckCircle2 size={13} /> PDF Extension
                </span>
                <span className={`validation-check-item ${precheck.checks.sizeLimit ? 'ok' : 'fail'}`}>
                  <CheckCircle2 size={13} /> ≤ 50 MiB
                </span>
                {precheck.checks.signature !== null && (
                  <span className={`validation-check-item ${precheck.checks.signature ? 'ok' : 'fail'}`}>
                    <ShieldCheck size={13} /> %PDF Header
                  </span>
                )}
                {precheck.checks.unencrypted !== null && (
                  <span className={`validation-check-item ${precheck.checks.unencrypted ? 'ok' : 'fail'}`}>
                    <ShieldCheck size={13} /> Unencrypted
                  </span>
                )}
              </div>
            )}

            {fileError && (
              <span className="form-error-text" role="alert" style={{ marginTop: '8px' }}>
                <AlertTriangle size={13} /> {fileError}
              </span>
            )}
          </div>

          <Input
            id="doc-title"
            label="Document Title"
            type="text"
            maxLength={500}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="e.g. Distributed Database Management Lab Exercises"
            required
            error={titleError ?? undefined}
          />

          <Input
            id="doc-author"
            label="Author(s) / Instructor"
            type="text"
            maxLength={250}
            value={author}
            onChange={(e) => {
              setAuthor(e.target.value);
              if (authorError) setAuthorError(null);
            }}
            placeholder="e.g. Dr. Ramesh Kulkarni, Prof. A. Sharma"
            hint="Optional (up to 250 characters)."
            error={authorError ?? undefined}
          />

          <Select
            id="doc-type"
            label="Document Classification"
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            required
            options={DOCUMENT_TYPES}
          />

          {loadingHierarchy ? (
            <div style={{ padding: '16px 0' }}>
              <Spinner size={22} label="Loading academic departments and subjects..." />
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                gap: '14px',
              }}
            >
              <div className="form-group">
                <label htmlFor="doc-dept" className="form-label">
                  <span>
                    Department <span style={{ color: 'var(--c-danger)' }}>*</span>
                  </span>
                </label>
                <select
                  id="doc-dept"
                  value={selectedDeptId}
                  onChange={(e) => {
                    const department = e.target.value;
                    setSelectedDeptId(department);
                    setSelectedSubjectId(
                      subjects.find((item) => item.departmentId === department)?.id ?? '',
                    );
                    setSubjectError(null);
                  }}
                  className="form-select"
                  required
                >
                  {!departments.length && <option value="">No departments available</option>}
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="doc-subject" className="form-label">
                  <span>
                    Course / Subject <span style={{ color: 'var(--c-danger)' }}>*</span>
                  </span>
                </label>
                <select
                  id="doc-subject"
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    if (subjectError) setSubjectError(null);
                  }}
                  className={`form-select ${subjectError ? 'has-error' : ''}`}
                  required
                >
                  {!filteredSubjects.length && <option value="">No subjects available in department</option>}
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {subjectError && (
                  <span className="form-error-text" role="alert">
                    <AlertTriangle size={13} /> {subjectError}
                  </span>
                )}
              </div>
            </div>
          )}

          {!loadingHierarchy && !hierarchyError && subjects.length === 0 && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                No academic subjects exist yet. Ask an Administrator to create at least one Course /
                Subject before uploading documents.
              </span>
            </div>
          )}

          {hierarchyError && (
            <div style={{ marginBottom: '16px' }}>
              <ErrorAlert message={hierarchyError} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setHierarchyRefresh((v) => v + 1)}
              >
                Retry loading subjects
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--c-divider)',
              display: 'flex',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/faculty/submissions')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!loadingHierarchy && subjects.length === 0}
              rightIcon={<ArrowRight size={15} />}
            >
              Submit for Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
