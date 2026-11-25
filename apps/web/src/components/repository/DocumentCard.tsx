import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DocumentDto, DepartmentDto, SubjectDto } from '../../api/types';
import { TypeBadge } from '../common/Badge';
import { downloadDocument, getErrorMessage } from '../../api';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Download, User, Calendar, Loader2 } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentDto;
  subject?: SubjectDto | undefined;
  department?: DepartmentDto | undefined;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document: doc, subject, department }) => {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const formattedDate = new Date(doc.uploadedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadDocument(doc.id, doc.title);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article className="doc-card" data-testid={`document-card-${doc.id}`}>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          <TypeBadge type={doc.type} />
        </div>

        <h3 className="doc-card-title">
          <Link to={`/library/${doc.id}`} className="table-doc-link" title={doc.title}>
            {doc.title}
          </Link>
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--c-text-muted)',
            marginBottom: '16px',
          }}
        >
          {(subject || department) && (
            <div style={{ color: 'var(--c-text-secondary)', fontWeight: 500 }}>
              {subject && <span style={{ color: 'var(--c-ink-strong)', fontWeight: 600 }}>{subject.name}</span>}
              {subject && department && ' · '}
              {department && <span>{department.name}</span>}
            </div>
          )}
          {doc.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} color="var(--c-text-subtle)" />
              <span>{doc.author}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontVariantNumeric: 'tabular-nums' }}>
            <Calendar size={13} color="var(--c-text-subtle)" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderTop: '1px solid var(--c-divider)',
          paddingTop: '12px',
        }}
      >
        <Link to={`/library/${doc.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          <BookOpen size={14} /> Read Online
        </Link>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 10px' }}
          title="Download PDF"
          aria-label={`Download ${doc.title}`}
        >
          {isDownloading ? <Loader2 size={14} className="spin-animate" /> : <Download size={14} />}
        </button>
      </div>
    </article>
  );
};
