import { apiRequest } from './client';
import type {
  PublicUser,
  ListResponse,
  CreatePrivilegedUserRequest,
  UpdateUserRoleRequest,
  UserEnvelope,
} from './types';

export async function listUsers(): Promise<ListResponse<PublicUser>> {
  return apiRequest<ListResponse<PublicUser>>('/users', {
    method: 'GET',
  });
}

export async function createPrivilegedUser(
  data: CreatePrivilegedUserRequest
): Promise<UserEnvelope> {
  return apiRequest<UserEnvelope>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUserRole(
  id: string,
  data: UpdateUserRoleRequest
): Promise<UserEnvelope> {
  return apiRequest<UserEnvelope>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  return apiRequest<void>(`/users/${id}`, {
    method: 'DELETE',
  });
}
