export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export const ADMIN_TOKEN_STORAGE_KEY = 'xiyu-wiki:admin-token';
export const ADMIN_AUTH_EXPIRED_EVENT = 'xiyu-wiki:admin-auth-expired';

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `Request failed: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function readAdminToken(): string | null {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeAdminToken(token: string) {
  try {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } catch {
    // Keep API calls usable even if storage is unavailable.
  }
}

export function clearAdminToken() {
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be disabled by the browser.
  }
}

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  auth?: boolean;
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = options.token ?? (options.auth ? readAdminToken() : null);
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    body,
    credentials: 'include',
    signal: options.signal,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) as unknown : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearAdminToken();
      window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
    }

    throw new ApiError(response.status, typeof payload === 'object' && payload && 'detail' in payload ? payload.detail : payload);
  }

  return payload as T;
}
