import { apiRequest } from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, UserEnvelope } from './types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function registerStudent(data: RegisterRequest): Promise<UserEnvelope> {
  return apiRequest<UserEnvelope>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function getCurrentUser(): Promise<UserEnvelope> {
  return apiRequest<UserEnvelope>('/auth/me', {
    method: 'GET',
  });
}
