import type {
  ApiError,
  DocumentFilterParams,
  SubmitPdfParams,
  RegisterRequest,
  LoginRequest,
  CreatePrivilegedUserRequest,
  UpdateUserRoleRequest,
  CreateDepartmentRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  UpdateDocumentMetadataRequest,
  DecisionRequest,
} from './types';
import { mockAdapter } from './mockAdapter';

const DEFAULT_API_BASE_URL = 'http://localhost:4000/api/v1';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || DEFAULT_API_BASE_URL;

// In-memory token storage (Per MSS v2.0 D-03: Bearer token is kept in memory)
let authToken: string | null = null;
let unauthorizedListeners: Array<() => void> = [];

// API mode: allows seamlessly switching between live API and the self-contained mock adapter
type ApiMode = 'live' | 'mock';
let apiMode: ApiMode =
  import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.MODE === 'test' ? 'mock' : 'mock';

export function setApiMode(mode: ApiMode) {
  apiMode = mode;
  window.dispatchEvent(new CustomEvent('evidy:api-mode-change', { detail: { mode } }));
}

export function getApiMode(): ApiMode {
  return apiMode;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function onUnauthorized(callback: () => void): () => void {
  unauthorizedListeners.push(callback);
  return () => {
    unauthorizedListeners = unauthorizedListeners.filter((cb) => cb !== callback);
  };
}

export function notifyUnauthorized() {
  authToken = null;
  for (const listener of unauthorizedListeners) {
    try {
      listener();
    } catch (e) {
      console.error('Error in unauthorized listener', e);
    }
  }
}

export class CustomApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown> | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown> | undefined
  ) {
    super(message);
    this.name = 'CustomApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    if (obj.error && typeof obj.error === 'object') {
      const apiErr = obj.error as Record<string, unknown>;
      if (typeof apiErr.message === 'string') return apiErr.message;
    }
    if (typeof obj.message === 'string') return obj.message;
  }
  return 'An unexpected error occurred.';
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // If in mock mode, mockAdapter handles requests directly or via simulated network
  if (apiMode === 'mock') {
    return handleMockRequest<T>(endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (authToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      notifyUnauthorized();
      const errorJson = (await res.json().catch(() => null)) as ApiError | null;
      throw new CustomApiError(
        401,
        errorJson?.error?.code || 'UNAUTHORIZED',
        errorJson?.error?.message || 'Unauthorized: session expired or invalid credentials',
        errorJson?.error?.details
      );
    }

    if (!res.ok) {
      let errorJson: ApiError | null = null;
      try {
        errorJson = await res.json();
      } catch {
        // Fallback for non-JSON errors
      }
      throw new CustomApiError(
        res.status,
        errorJson?.error?.code || `HTTP_${res.status}`,
        errorJson?.error?.message || `Request failed with HTTP status ${res.status}`,
        errorJson?.error?.details
      );
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof CustomApiError) {
      throw err;
    }
    // Handle offline / network errors gracefully
    throw new CustomApiError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the E-Vidyakosha server. Please check your connection or switch to mock mode.'
    );
  }
}

export async function apiGetBlob(endpoint: string): Promise<Blob> {
  if (apiMode === 'mock') {
    return handleMockBlob(endpoint);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (res.status === 401) {
      notifyUnauthorized();
      throw new CustomApiError(401, 'UNAUTHORIZED', 'Session expired');
    }
    if (!res.ok) {
      throw new CustomApiError(res.status, `HTTP_${res.status}`, 'Failed to retrieve document binary');
    }
    return await res.blob();
  } catch (err: unknown) {
    if (err instanceof CustomApiError) {
      throw err;
    }
    throw new CustomApiError(0, 'NETWORK_ERROR', 'Network failure retrieving PDF');
  }
}

// Router for mock adapter requests
function handleMockRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const method = (options.method || 'GET').toUpperCase();
      const parts = endpoint.split('?');
      const path = parts[0] || '';
      const queryStr = parts[1] || '';
      const searchParams = new URLSearchParams(queryStr);

      // Parse JSON body if present
      let body: unknown = null;
      if (options.body && typeof options.body === 'string') {
        try {
          body = JSON.parse(options.body);
        } catch {
          body = options.body;
        }
      }

      // /auth/register
      if (method === 'POST' && path === '/auth/register') {
        return resolve(mockAdapter.registerStudent(body as RegisterRequest) as unknown as T);
      }
      // /auth/login
      if (method === 'POST' && path === '/auth/login') {
        return resolve(mockAdapter.login(body as LoginRequest) as unknown as T);
      }
      // /auth/me
      if (method === 'GET' && path === '/auth/me') {
        return resolve(mockAdapter.getMe() as unknown as T);
      }
      // /users
      if (method === 'GET' && path === '/users') {
        return resolve(mockAdapter.listUsers() as unknown as T);
      }
      if (method === 'POST' && path === '/users') {
        return resolve(mockAdapter.createPrivilegedUser(body as CreatePrivilegedUserRequest) as unknown as T);
      }
      const userMatch = path.match(/^\/users\/([a-fA-F0-9]{24})$/);
      if (userMatch && userMatch[1]) {
        const id = userMatch[1];
        if (method === 'PATCH') {
          return resolve(mockAdapter.updateUserRole(id, (body as UpdateUserRoleRequest).role) as unknown as T);
        }
        if (method === 'DELETE') {
          mockAdapter.deleteUser(id);
          return resolve(undefined as unknown as T);
        }
      }
      // /departments
      if (method === 'GET' && path === '/departments') {
        return resolve(mockAdapter.listDepartments() as unknown as T);
      }
      if (method === 'POST' && path === '/departments') {
        return resolve(mockAdapter.createDepartment(body as CreateDepartmentRequest) as unknown as T);
      }
      const deptMatch = path.match(/^\/departments\/([a-fA-F0-9]{24})$/);
      if (deptMatch && deptMatch[1] && method === 'DELETE') {
        mockAdapter.deleteDepartment(deptMatch[1]);
        return resolve(undefined as unknown as T);
      }
      // /subjects
      if (method === 'GET' && path === '/subjects') {
        const deptId = searchParams.get('departmentId') || undefined;
        return resolve(mockAdapter.listSubjects(deptId) as unknown as T);
      }
      if (method === 'POST' && path === '/subjects') {
        return resolve(mockAdapter.createSubject(body as CreateSubjectRequest) as unknown as T);
      }
      const subjectMatch = path.match(/^\/subjects\/([a-fA-F0-9]{24})$/);
      if (subjectMatch && subjectMatch[1]) {
        const id = subjectMatch[1];
        if (method === 'PATCH') {
          return resolve(mockAdapter.updateSubject(id, body as UpdateSubjectRequest) as unknown as T);
        }
        if (method === 'DELETE') {
          mockAdapter.deleteSubject(id);
          return resolve(undefined as unknown as T);
        }
      }
      // /documents
      if (method === 'GET' && path === '/documents') {
        const q = searchParams.get('q') || undefined;
        const subjectId = searchParams.get('subjectId') || undefined;
        const type = (searchParams.get('type') as DocumentFilterParams['type']) || undefined;
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
        const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 20;

        const filterParams: DocumentFilterParams = {};
        if (q) filterParams.q = q;
        if (subjectId) filterParams.subjectId = subjectId;
        if (type) filterParams.type = type;
        if (page) filterParams.page = page;
        if (pageSize) filterParams.pageSize = pageSize;

        return resolve(mockAdapter.searchApprovedDocuments(filterParams) as unknown as T);
      }
      if (method === 'POST' && path === '/documents') {
        if (options.body instanceof FormData) {
          const file = options.body.get('file') as File;
          const title = options.body.get('title') as string;
          const author = (options.body.get('author') as string) || undefined;
          const type = options.body.get('type') as SubmitPdfParams['type'];
          const subjectId = options.body.get('subjectId') as string;

          const submitParams: SubmitPdfParams = {
            file,
            title,
            type,
            subjectId,
            ...(author ? { author } : {}),
          };
          return resolve(mockAdapter.submitPdf(submitParams) as unknown as T);
        }
      }
      const docMatch = path.match(/^\/documents\/([a-fA-F0-9]{24})$/);
      if (docMatch && docMatch[1]) {
        const id = docMatch[1];
        if (method === 'GET') {
          return resolve(mockAdapter.getApprovedDocument(id) as unknown as T);
        }
        if (method === 'PATCH') {
          return resolve(mockAdapter.updateDocumentMetadata(id, body as UpdateDocumentMetadataRequest) as unknown as T);
        }
        if (method === 'DELETE') {
          mockAdapter.deleteDocument(id);
          return resolve(undefined as unknown as T);
        }
      }
      // /uploads/mine
      if (method === 'GET' && path === '/uploads/mine') {
        return resolve(mockAdapter.listOwnSubmissions() as unknown as T);
      }
      // /approvals/pending
      if (method === 'GET' && path === '/approvals/pending') {
        return resolve(mockAdapter.listPendingApprovals() as unknown as T);
      }
      // /approvals/{id}/decision
      const approvalMatch = path.match(/^\/approvals\/([a-fA-F0-9]{24})\/decision$/);
      if (approvalMatch && approvalMatch[1] && method === 'POST') {
        return resolve(mockAdapter.decideUpload(approvalMatch[1], body as DecisionRequest) as unknown as T);
      }

      reject(new CustomApiError(404, 'NOT_FOUND', `Route ${method} ${path} not recognized by mock adapter`));
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'status' in e &&
        'error' in e
      ) {
        const errObj = e as { status: number; error: { code: string; message: string; details?: Record<string, unknown> } };
        reject(new CustomApiError(errObj.status, errObj.error.code, errObj.error.message, errObj.error.details));
      } else {
        const message = e instanceof Error ? e.message : 'Unexpected error';
        reject(new CustomApiError(500, 'INTERNAL_ERROR', message));
      }
    }
  });
}

function handleMockBlob(endpoint: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const match = endpoint.match(/^\/documents\/([a-fA-F0-9]{24})\/(pdf|download)$/);
      if (match && match[1]) {
        const id = match[1];
        const blob = mockAdapter.getPdfBlob(id);
        resolve(blob);
      } else {
        reject(new CustomApiError(404, 'NOT_FOUND', 'PDF endpoint not found in mock'));
      }
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'status' in e &&
        'error' in e
      ) {
        const errObj = e as { status: number; error: { code: string; message: string } };
        reject(new CustomApiError(errObj.status, errObj.error.code, errObj.error.message));
      } else {
        reject(new CustomApiError(500, 'INTERNAL_ERROR', 'Failed to retrieve mock PDF'));
      }
    }
  });
}
