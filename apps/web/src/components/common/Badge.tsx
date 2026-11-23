import React from 'react';
import type { DocumentStatus, DocumentType, UserRole } from '../../api/types';
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="badge badge-approved" data-testid="status-approved">
          <CheckCircle2 size={13} />
          Approved
        </span>
      );
    case 'PENDING':
      return (
        <span className="badge badge-pending" data-testid="status-pending">
          <Clock size={13} />
          Under Review
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge badge-rejected" data-testid="status-rejected">
          <XCircle size={13} />
          Needs Revision
        </span>
      );
  }
};

export const TypeBadge: React.FC<{ type: DocumentType }> = ({ type }) => {
  const labels: Record<DocumentType, string> = {
    EBOOK: 'eBook',
    REFERENCE_BOOK: 'Reference Book',
    RESEARCH_PAPER: 'Research Paper',
    LAB_MANUAL: 'Lab Manual',
    LECTURE_NOTES: 'Lecture Notes',
    QUESTION_PAPER: 'Question Paper',
    OTHER: 'Academic Resource',
  };

  return (
    <span className="badge badge-type">
      <FileText size={12} />
      {labels[type] || type}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const colors: Record<UserRole, { bg: string; text: string }> = {
    STUDENT: { bg: 'rgba(59, 130, 246, 0.15)', text: '#1d4ed8' },
    FACULTY: { bg: 'rgba(16, 185, 129, 0.15)', text: '#065f46' },
    ADMIN: { bg: 'rgba(139, 92, 246, 0.15)', text: '#5b21b6' },
  };

  const style = colors[role] || colors.STUDENT;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.text}33`,
      }}
    >
      {role}
    </span>
  );
};
