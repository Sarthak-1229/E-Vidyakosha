import { apiRequest, apiGetPdf } from './client';
import type {
  DocumentDto,
  DocumentFilterParams,
  ListResponse,
  SubmitPdfParams,
  SubmitPdfResponse,
  UpdateDocumentMetadataRequest,
} from './types';

export async function searchApprovedDocuments(
  params?: DocumentFilterParams, signal?: AbortSignal,
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
    ...(signal ? { signal } : {}),
  });
}

export async function getApprovedDocument(id: string, signal?: AbortSignal): Promise<DocumentDto> {
  return apiRequest<DocumentDto>(`/documents/${id}`, {
    method: 'GET', ...(signal ? { signal } : {}),
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

export async function getInlinePdfBlob(id: string, signal?: AbortSignal): Promise<Blob> {
  return (await apiGetPdf(`/documents/${id}/pdf`, signal)).blob;
}

export async function downloadDocument(id: string, title: string) {
  const { blob, filename } = await apiGetPdf(`/documents/${id}/download`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
