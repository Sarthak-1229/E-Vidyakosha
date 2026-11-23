import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DocumentDto, SubjectDto } from '../../api/types';
import { TypeBadge } from '../common/Badge';
import { downloadPdfBlob } from '../../api';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Download, User, Calendar, Loader2 } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentDto;
  subject?: SubjectDto | undefined;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document: doc, subject }) => {
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
      const blob = await downloadPdfBlob(doc.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Download started', 'success');
    } catch {
      showToast('Failed to download document', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <article
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '26px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`document-card-${doc.id}`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <TypeBadge type={doc.type} />
          {subject && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--c-slate)',
                background: 'rgba(255, 255, 255, 0.7)',
                padding: '3px 9px',
                borderRadius: '6px',
                border: '1px solid rgba(71, 85, 105, 0.1)',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={subject.name}
            >
              {subject.name}
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: '17px',
            lineHeight: 1.35,
            color: 'var(--c-midnight)',
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <Link
            to={`/library/${doc.id}`}
            style={{ color: 'inherit' }}
            title={doc.title}
          >
            {doc.title}
          </Link>
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--c-text-secondary)',
            marginBottom: '20px',
          }}
        >
          {doc.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} color="var(--c-slate-light)" />
              <span>{doc.author}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="var(--c-slate-light)" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderTop: '1px solid rgba(15, 23, 42, 0.08)',
          paddingTop: '16px',
        }}
      >
        <Link
          to={`/library/${doc.id}`}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          <BookOpen size={14} /> Read Online
        </Link>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn btn-ghost btn-sm"
          style={{
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.5)',
            border: '1px solid var(--c-glass-border)',
            borderRadius: '9999px',
          }}
          title="Download PDF"
          aria-label={`Download ${doc.title}`}
        >
          {isDownloading ? (
            <Loader2 size={15} className="spin-animate" />
          ) : (
            <Download size={15} />
          )}
        </button>
      </div>
    </article>
  );
};
