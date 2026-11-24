import { apiRequest } from './client';
import type {
  DepartmentDto,
  SubjectDto,
  CreateDepartmentRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
} from './types';

export async function listDepartments(): Promise<DepartmentDto[]> {
  return apiRequest<DepartmentDto[]>('/departments', {
    method: 'GET',
  });
}

export async function createDepartment(data: CreateDepartmentRequest): Promise<DepartmentDto> {
  return apiRequest<DepartmentDto>('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: string): Promise<void> {
  return apiRequest<void>(`/departments/${id}`, {
    method: 'DELETE',
  });
}

export async function listSubjects(departmentId?: string): Promise<SubjectDto[]> {
  const query = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
  return apiRequest<SubjectDto[]>(`/subjects${query}`, {
    method: 'GET',
  });
}

export async function createSubject(data: CreateSubjectRequest): Promise<SubjectDto> {
  return apiRequest<SubjectDto>('/subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSubject(id: string, data: UpdateSubjectRequest): Promise<SubjectDto> {
  return apiRequest<SubjectDto>(`/subjects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteSubject(id: string): Promise<void> {
  return apiRequest<void>(`/subjects/${id}`, {
    method: 'DELETE',
  });
}
