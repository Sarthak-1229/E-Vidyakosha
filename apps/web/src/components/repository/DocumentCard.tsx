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
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          <TypeBadge type={doc.type} />
          {subject && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--c-text-secondary)',
                background: 'var(--c-surface-subtle)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--c-border)',
                maxWidth: '175px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={department ? `${department.name} · ${subject.name}` : subject.name}
            >
              {subject.name}
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: '15.5px',
            lineHeight: 1.35,
            color: 'var(--c-ink)',
            marginBottom: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
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
          {department && (
            <div style={{ color: 'var(--c-text-secondary)', fontWeight: 500 }}>
              {department.name}
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
