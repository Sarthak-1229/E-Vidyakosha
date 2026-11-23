import { apiRequest, apiGetBlob } from './client';
import type {
  DocumentDto,
  DocumentFilterParams,
  ListResponse,
  SubmitPdfParams,
  SubmitPdfResponse,
  UpdateDocumentMetadataRequest,
} from './types';

export async function searchApprovedDocuments(
  params?: DocumentFilterParams
): Promise<ListResponse<DocumentDto>> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.subjectId) searchParams.set('subjectId', params.subjectId);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const query = searchParams.toString();
  return apiRequest<ListResponse<DocumentDto>>(`/documents${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

export async function getApprovedDocument(id: string): Promise<DocumentDto> {
  return apiRequest<DocumentDto>(`/documents/${id}`, {
    method: 'GET',
  });
}

export async function submitPdf(params: SubmitPdfParams): Promise<SubmitPdfResponse> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('title', params.title);
  if (params.author) {
    formData.append('author', params.author);
  }
  formData.append('type', params.type);
  formData.append('subjectId', params.subjectId);

  return apiRequest<SubmitPdfResponse>('/documents', {
    method: 'POST',
    body: formData,
  });
}

export async function updateDocumentMetadata(
  id: string,
  data: UpdateDocumentMetadataRequest
): Promise<DocumentDto> {
  return apiRequest<DocumentDto>(`/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  return apiRequest<void>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function getInlinePdfBlob(id: string): Promise<Blob> {
  return apiGetBlob(`/documents/${id}/pdf`);
}

export async function downloadPdfBlob(id: string): Promise<Blob> {
  return apiGetBlob(`/documents/${id}/download`);
}
