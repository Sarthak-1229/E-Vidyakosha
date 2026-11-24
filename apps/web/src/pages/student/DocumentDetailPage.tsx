import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApprovedDocument, listSubjects, listDepartments, getErrorMessage } from '../../api';
import type { DocumentDto, SubjectDto, DepartmentDto } from '../../api/types';
import { PdfViewer } from '../../components/viewer/PdfViewer';
import { TypeBadge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ArrowLeft, User, Calendar, BookOpen } from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [subject, setSubject] = useState<SubjectDto | null>(null);
  const [department, setDepartment] = useState<DepartmentDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setDocument(null);
    setSubject(null);
    setDepartment(null);
    async function load() {
      try {
        if (!id || !/^[a-f0-9]{24}$/i.test(id)) throw new Error('Document not found.');
        const doc = await getApprovedDocument(id, controller.signal);
        const [subjects, departments] = await Promise.allSettled([listSubjects(), listDepartments()]);
        if (controller.signal.aborted) return;
        setDocument(doc);
        if (subjects.status === 'fulfilled') {
          const course = subjects.value.find(item => item.id === doc.subjectId);
          setSubject(course ?? null);
          if (departments.status === 'fulfilled') {
            setDepartment(departments.value.find(item => item.id === course?.departmentId) ?? null);
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(getErrorMessage(cause));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <Spinner size={36} label="Loading document details..." />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <ErrorAlert message={error || 'Document not found'} />
        <Link to="/library" className="btn btn-primary" style={{ marginTop: '20px' }}>
          <ArrowLeft size={16} /> Back to Library
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(document.uploadedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          to="/library"
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={14} /> Back to Library
        </Link>
      </div>

      {/* Document Header Metadata */}
      <div
        className="glass-card"
        style={{
          marginBottom: '24px',
          padding: '28px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
          <TypeBadge type={document.type} />
          {department && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--c-slate)',
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '3px 9px',
                borderRadius: '6px',
                border: '1px solid rgba(71, 85, 105, 0.1)',
              }}
            >
              {department.name}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '26px', color: 'var(--c-midnight)', marginBottom: '14px' }}>
          {document.title}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '13px',
            color: 'var(--c-text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          {document.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="var(--c-slate-light)" />
              <span>
                Author: <strong>{document.author}</strong>
              </span>
            </div>
          )}

          {subject && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={15} color="var(--c-slate-light)" />
              <span>
                Subject: <strong>{subject.name}</strong>
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="var(--c-slate-light)" />
            <span>
              Uploaded: <strong>{formattedDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Inline PDF Viewer (FR-11) & Download (FR-12) */}
      <PdfViewer documentId={document.id} documentTitle={document.title} />
    </div>
  );
};
