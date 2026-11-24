import { apiRequest } from './client';
import type { SubmissionDto } from './types';

export async function listOwnSubmissions(): Promise<SubmissionDto[]> {
  return apiRequest<SubmissionDto[]>('/uploads/mine', {
    method: 'GET',
  });
}
