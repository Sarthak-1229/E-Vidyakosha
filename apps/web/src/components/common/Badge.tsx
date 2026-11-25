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
          Rejected
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
  const colors: Record<UserRole, { bg: string; border: string; text: string }> = {
    STUDENT: { bg: '#ebf0f6', border: '#c5d3e2', text: '#213a57' },
    FACULTY: { bg: '#edf6f0', border: '#bddac7', text: '#1b4d33' },
    ADMIN: { bg: '#f2eef6', border: '#d6cbe2', text: '#4a3363' },
  };

  const style = colors[role] || colors.STUDENT;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {role}
    </span>
  );
};
