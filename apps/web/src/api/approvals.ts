import { apiRequest } from './client';
import type { SubmissionDto, DecisionRequest } from './types';

export async function listPendingApprovals(): Promise<SubmissionDto[]> {
  return apiRequest<SubmissionDto[]>('/approvals/pending', {
    method: 'GET',
  });
}

export async function decideUpload(id: string, data: DecisionRequest): Promise<SubmissionDto> {
  return apiRequest<SubmissionDto>(`/approvals/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
