import type { ApiError } from './types';
import { CustomApiError } from './errors';

export { CustomApiError, getErrorMessage } from './errors';

const apiBase = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1').replace(/\/+$/, '');
export const useMockApi = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true';
let authToken: string | null = null;
const unauthorizedListeners = new Set<() => void>();

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);
  return () => { unauthorizedListeners.delete(listener); };
}

async function readError(response: Response) {
  const error = await response.json().catch(() => null) as ApiError | null;
  return new CustomApiError(
    response.status,
    error?.error?.code ?? `HTTP_${response.status}`,
    error?.error?.message ?? `The server returned HTTP ${response.status}.`,
    error?.error?.details,
  );
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

function clearExpiredSession(token: string | null, status: number) {
  // A delayed response from an older session must not sign out a new session.
  if (status === 401 && token && token === authToken) {
    setAuthToken(null);
    for (const listener of unauthorizedListeners) listener();
  }
}

async function request(endpoint: string, { skipAuth, ...options }: RequestOptions = {}) {
  const token = skipAuth ? null : authToken;
  const headers = new Headers(options.headers);
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(apiBase + endpoint, { ...options, headers });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new CustomApiError(0, 'NETWORK_ERROR', 'Unable to connect to E-Vidyakosha. Check your connection and try again.');
  }
  clearExpiredSession(token, response.status);
  if (!response.ok) throw await readError(response);
  return response;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  if (useMockApi) {
    const token = options.skipAuth ? null : authToken;
    try {
      const { mockRequest } = await import('./mockTransport');
      if (!options.skipAuth && !token) throw new CustomApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
      return await mockRequest<T>(endpoint, options);
    } catch (error) {
      if (error instanceof CustomApiError) clearExpiredSession(token, error.status);
      throw error;
    }
  }

  const response = await request(endpoint, options);
  if (response.status === 204) return undefined as T;
  try {
    return await response.json() as T;
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new CustomApiError(response.status, 'INVALID_RESPONSE', 'The server returned an unreadable response.');
  }
}

function responseFilename(disposition: string | null) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Use the ordinary filename if the UTF-8 parameter is malformed.
    }
  }
  return disposition?.match(/filename="([^"]+)"|filename=([^;]+)/i)?.slice(1).find(Boolean)?.trim();
}

export async function apiGetPdf(endpoint: string, signal?: AbortSignal) {
  if (useMockApi) {
    const { mockBlob } = await import('./mockTransport');
    return { blob: await mockBlob(endpoint), filename: undefined };
  }
  const response = await request(endpoint, signal ? { signal } : {});
  if (response.headers.get('content-type')?.split(';')[0] !== 'application/pdf') {
    throw new CustomApiError(response.status, 'INVALID_RESPONSE', 'The server did not return a PDF.');
  }
  return { blob: await response.blob(), filename: responseFilename(response.headers.get('Content-Disposition')) };
}
