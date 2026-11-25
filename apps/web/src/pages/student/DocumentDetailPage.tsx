import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApprovedDocument, listSubjects, listDepartments, getErrorMessage } from '../../api';
import type { DocumentDto, SubjectDto, DepartmentDto } from '../../api/types';
import { PdfViewer } from '../../components/viewer/PdfViewer';
import { TypeBadge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorAlert } from '../../components/common/ErrorAlert';
import { ArrowLeft, User, Calendar, BookOpen, Building2, ChevronRight } from 'lucide-react';

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
          const course = subjects.value.find((item) => item.id === doc.subjectId);
          setSubject(course ?? null);
          if (departments.status === 'fulfilled') {
            setDepartment(departments.value.find((item) => item.id === course?.departmentId) ?? null);
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
      <div style={{ padding: '72px 0', textAlign: 'center' }}>
        <Spinner size={30} label="Loading document details..." />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="panel" style={{ maxWidth: '560px', margin: '36px auto', textAlign: 'center' }}>
        <ErrorAlert message={error || 'Document not found'} />
        <Link to="/library" className="btn btn-primary" style={{ marginTop: '14px' }}>
          <ArrowLeft size={15} /> Back to Library
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
    <div>
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '16px',
          fontSize: '12.5px',
          color: 'var(--c-text-muted)',
        }}
      >
        <Link to="/library" className="btn btn-secondary btn-sm">
          <ArrowLeft size={13} /> Back to Library
        </Link>
        {department && (
          <>
            <ChevronRight size={14} />
            <Link to={`/library?dept=${department.id}`} style={{ color: 'var(--c-text-secondary)' }}>
              {department.name}
            </Link>
          </>
        )}
        {subject && (
          <>
            <ChevronRight size={14} />
            <Link
              to={`/library?dept=${subject.departmentId}&subject=${subject.id}`}
              style={{ color: 'var(--c-accent-pressed)', fontWeight: 600 }}
            >
              {subject.name}
            </Link>
          </>
        )}
      </nav>

      {/* Metadata Citation Panel */}
      <div
        className="panel"
        style={{
          marginBottom: '18px',
          padding: '20px 24px',
          borderTop: '3px solid var(--c-accent)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          <TypeBadge type={document.type} />
          <span className="badge badge-approved">Approved Resource</span>
        </div>

        <h1 style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', marginBottom: '12px' }}>
          {document.title}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '13px',
            color: 'var(--c-text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          {department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} color="var(--c-text-subtle)" />
              <span>{department.name}</span>
            </div>
          )}

          {subject && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} color="var(--c-text-subtle)" />
              <span>
                Subject: <strong>{subject.name}</strong>
              </span>
            </div>
          )}

          {document.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="var(--c-text-subtle)" />
              <span>
                Author: <strong>{document.author}</strong>
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--c-text-subtle)" />
            <span>
              Uploaded: <strong>{formattedDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Inline PDF Viewer (FR-11) & Download (FR-12) */}
      <PdfViewer documentId={document.id} documentTitle={document.title} />
    </div>
  );
};
