/** Stable data-contract constants; change via contract PR only. */
export const USER_ROLES = ['STUDENT', 'FACULTY', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DOCUMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_TYPES = [
  'EBOOK', 'REFERENCE_BOOK', 'RESEARCH_PAPER', 'LAB_MANUAL',
  'LECTURE_NOTES', 'QUESTION_PAPER', 'OTHER',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const INSTITUTION_EMAIL_DOMAIN = 'mitaoe.ac.in';

export type ObjectIdString = string;

export interface PublicUser {
  id: ObjectIdString;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface DepartmentDto {
  id: ObjectIdString;
  name: string;
}

export interface SubjectDto {
  id: ObjectIdString;
  name: string;
  departmentId: ObjectIdString;
}

export interface DocumentDto {
  id: ObjectIdString;
  title: string;
  author: string | null;
  type: DocumentType;
  subjectId: ObjectIdString;
  uploadedAt: string;
}

export interface SubmissionDto {
  id: ObjectIdString;
  document: DocumentDto;
  status: DocumentStatus;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ApiError {
  error: { code: string; message: string; details?: Record<string, unknown> };
}
export interface ListResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
