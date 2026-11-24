import type { UserRole } from '../api/types';

export function getRoleHomePath(role?: UserRole | null): string {
  if (role === 'ADMIN') return '/admin/approvals';
  if (role === 'FACULTY') return '/faculty/submissions';
  return '/library';
}
