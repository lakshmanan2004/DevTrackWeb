// Thin fetch wrapper around the DevTrack API.
// In dev, calls go to the Vite proxy (/api -> localhost:5000).
// In production, set VITE_API_URL to the backend base URL (e.g. https://devtrack-api.onrender.com).
export const API_BASE = import.meta.env.VITE_API_URL || '';

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function triggerUnauthorized() {
  unauthorizedListeners.forEach((fn) => fn());
}

export function getToken(): string | null {
  return localStorage.getItem('devtrack_token') || sessionStorage.getItem('devtrack_token');
}

export function setToken(token: string | null, remember = true) {
  if (token) {
    if (remember) {
      localStorage.setItem('devtrack_token', token);
      sessionStorage.removeItem('devtrack_token');
    } else {
      sessionStorage.setItem('devtrack_token', token);
      localStorage.removeItem('devtrack_token');
    }
  } else {
    localStorage.removeItem('devtrack_token');
    sessionStorage.removeItem('devtrack_token');
  }
}

export async function api<T = any>(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      triggerUnauthorized();
    }
    const err: any = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data as T;
}

// Multipart upload helper (screenshots).
export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      triggerUnauthorized();
    }
    const err: any = new Error(data.error || `Upload failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data as T;
}

// Prefix for files served by the backend (local uploads fallback).
export function fileUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}
