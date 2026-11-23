import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPdf, listDepartments, listSubjects, getErrorMessage } from '../../api';
import type { DepartmentDto, SubjectDto, DocumentType, SubmitPdfParams } from '../../api/types';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import {
  UploadCloud,
  FileText,
  X,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MiB = 52,428,800 bytes (D-06)

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

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);

  // Form fields
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState<DocumentType>('LECTURE_NOTES');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Validation & Submission state
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    async function loadHierarchy() {
      try {
        const [depts, subs] = await Promise.all([listDepartments(), listSubjects()]);
        setDepartments(depts);
        setSubjects(subs);
        if (depts.length > 0 && depts[0]) {
          setSelectedDeptId(depts[0].id);
        }
      } catch {
        // Handled gracefully
      }
    }
    loadHierarchy();
  }, []);

  // Filter subjects by selected department
  const filteredSubjects = selectedDeptId
    ? subjects.filter((s) => s.departmentId === selectedDeptId)
    : subjects;

  useEffect(() => {
    if (filteredSubjects.length > 0 && filteredSubjects[0] && !filteredSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(filteredSubjects[0].id);
    }
  }, [filteredSubjects, selectedSubjectId]);

  const validateFile = (selectedFile: File): boolean => {
    setFileError(null);

    // Size limit <= 50 MiB
    if (selectedFile.size > MAX_BYTES) {
      setFileError('File exceeds maximum allowable size of 50 MiB.');
      return false;
    }

    // Type must be PDF
    if (
      !selectedFile.name.toLowerCase().endsWith('.pdf') &&
      selectedFile.type !== 'application/pdf'
    ) {
      setFileError('Invalid file format. Only PDF documents are accepted.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
        if (!title) {
          setTitle(selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
        }
      } else {
        setFile(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (validateFile(selected)) {
        setFile(selected);
        if (!title) {
          setTitle(selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
        }
      } else {
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);
    setTitleError(null);
    setSubjectError(null);
    setServerError(null);

    let hasErrors = false;

    if (!file) {
      setFileError('Please select a valid PDF file.');
      hasErrors = true;
    }

    if (!title.trim()) {
      setTitleError('Document title is required.');
      hasErrors = true;
    }

    if (!selectedSubjectId) {
      setSubjectError('Please select a subject.');
      hasErrors = true;
    }

    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      const params: SubmitPdfParams = {
        file: file!,
        title: title.trim(),
        type,
        subjectId: selectedSubjectId,
        ...(author.trim() ? { author: author.trim() } : {}),
      };

      await submitPdf(params);

      showToast('Document uploaded successfully and queued for review!', 'success');
      navigate('/faculty/submissions');
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span className="eyebrow light">
          <span className="eyebrow-dot" /> Faculty Contribution Portal
        </span>
        <h1 style={{ color: '#ffffff', marginBottom: '8px' }}>Upload Academic Resource</h1>
        <p style={{ color: '#e2e8f0', fontSize: '15px' }}>
          Contribute course materials, lab manuals, and papers. Submissions undergo administrative
          quality review before appearing in the institutional repository.
        </p>
      </div>

      <div className="glass-card">
        {serverError && <ErrorAlert message={serverError} />}

        <form onSubmit={handleSubmit}>
          {/* Drag & Drop Upload Zone */}
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Academic PDF Document <span style={{ color: '#ef4444' }}>*</span>
            </label>

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${
                    isDragging ? '#38bdf8' : fileError ? '#ef4444' : 'rgba(71, 85, 105, 0.3)'
                  }`,
                  borderRadius: '20px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: isDragging ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => document.getElementById('pdf-file-input')?.click()}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 14px',
                    color: 'var(--c-slate)',
                  }}
                >
                  <UploadCloud size={28} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--c-midnight)' }}>
                  Click to browse or drag and drop PDF file here
                </div>
                <div style={{ fontSize: '12px', color: 'var(--c-text-muted)', marginTop: '6px' }}>
                  Maximum file size: 50 MiB <span>·</span> Readable unencrypted PDF only
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid var(--c-glass-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#dc2626',
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--c-midnight)' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB <span>·</span> PDF Document
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="btn-ghost"
                  aria-label="Remove selected file"
                  style={{ padding: '6px', borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {fileError && (
              <span className="form-error-text" style={{ marginTop: '6px' }}>
                <AlertTriangle size={13} /> {fileError}
              </span>
            )}
          </div>

          {/* Title */}
          <Input
            id="doc-title"
            label="Document Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Database Management Lab Exercises"
            required
            error={titleError ? titleError : undefined}
          />

          {/* Author */}
          <Input
            id="doc-author"
            label="Author(s) / Instructor"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Dr. Ramesh Kulkarni, Prof. A. Sharma"
            hint="Optional. Specify instructor, author, or department cell."
          />

          {/* Document Type */}
          <Select
            id="doc-type"
            label="Document Classification"
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            required
            options={DOCUMENT_TYPES}
          />

          {/* Department & Subject Selection */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="form-group">
              <label htmlFor="doc-dept" className="form-label">
                Department <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="doc-dept"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="form-select"
                required
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="doc-subject" className="form-label">
                Course / Subject <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="doc-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className={`form-select ${subjectError ? 'has-error' : ''}`}
                required
              >
                {filteredSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              {subjectError && <span className="form-error-text">{subjectError}</span>}
            </div>
          </div>

          {/* Submit Action */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(15, 23, 42, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
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
              rightIcon={<ArrowRight size={16} />}
            >
              Submit for Review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
