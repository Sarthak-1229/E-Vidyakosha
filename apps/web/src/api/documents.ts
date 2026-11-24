import { apiRequest, apiGetPdf } from './client';
import type {
  DocumentDto,
  DocumentFilterParams,
  ListResponse,
  SubjectDto,
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

async function fetchAllSubjectMatches(
  params: DocumentFilterParams,
  subjectId: string,
  signal?: AbortSignal,
): Promise<DocumentDto[]> {
  const batchSize = 100;
  const first = await searchApprovedDocuments(
    { ...params, subjectId, page: 1, pageSize: batchSize },
    signal,
  );
  if (first.total <= first.items.length) return first.items;

  const totalPages = Math.ceil(first.total / batchSize);
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, idx) =>
      searchApprovedDocuments(
        { ...params, subjectId, page: idx + 2, pageSize: batchSize },
        signal,
      ),
    ),
  );
  return [first, ...rest].flatMap((res) => res.items);
}

/**
 * Searches approved documents while supporting Department-level filtering on top of
 * the OpenAPI GET /documents endpoint (which filters natively by subjectId).
 */
export async function searchDocumentsInScope(
  params: DocumentFilterParams,
  departmentId: string | undefined,
  subjects: SubjectDto[],
  signal?: AbortSignal,
): Promise<ListResponse<DocumentDto>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  if (!departmentId || params.subjectId) {
    return searchApprovedDocuments(params, signal);
  }

  const deptSubjects = subjects.filter((s) => s.departmentId === departmentId);
  if (deptSubjects.length === 0) {
    return { items: [], page, pageSize, total: 0 };
  }
  if (deptSubjects.length === 1) {
    return searchApprovedDocuments({ ...params, subjectId: deptSubjects[0]!.id }, signal);
  }

  const perSubject = await Promise.all(
    deptSubjects.map((sub) => fetchAllSubjectMatches(params, sub.id, signal)),
  );
  const deduped = new Map<string, DocumentDto>();
  for (const list of perSubject) {
    for (const doc of list) {
      deduped.set(doc.id, doc);
    }
  }
  const sorted = Array.from(deduped.values()).sort((a, b) => {
    const timeDiff = Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt);
    return timeDiff !== 0 ? timeDiff : b.id.localeCompare(a.id);
  });
  const start = (page - 1) * pageSize;
  return {
    items: sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total: sorted.length,
  };
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
