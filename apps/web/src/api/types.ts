import type {
  UserRole,
  DocumentStatus,
  DocumentType,
  PublicUser,
  DepartmentDto,
  SubjectDto,
  DocumentDto,
  SubmissionDto,
  ApiError,
  ListResponse,
} from '@evidy/shared';

export type {
  UserRole,
  DocumentStatus,
  DocumentType,
  PublicUser,
  DepartmentDto,
  SubjectDto,
  DocumentDto,
  SubmissionDto,
  ApiError,
  ListResponse,
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserEnvelope {
  user: PublicUser;
}

export interface CreatePrivilegedUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'FACULTY' | 'ADMIN';
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface CreateDepartmentRequest {
  name: string;
}

export interface CreateSubjectRequest {
  name: string;
  departmentId: string;
}

export interface UpdateSubjectRequest {
  name: string;
}

export interface DocumentFilterParams {
  q?: string | undefined;
  subjectId?: string | undefined;
  type?: DocumentType | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface SubmitPdfParams {
  file: File;
  title: string;
  author?: string | undefined;
  type: DocumentType;
  subjectId: string;
}

export interface SubmitPdfResponse {
  submissionId: string;
  status: 'PENDING';
}

export interface UpdateDocumentMetadataRequest {
  title?: string | undefined;
  author?: string | null | undefined;
  type?: DocumentType | undefined;
  subjectId?: string | undefined;
}

export interface DecisionRequest {
  decision: 'APPROVED' | 'REJECTED';
  reason?: string | undefined;
}
