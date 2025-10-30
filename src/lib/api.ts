export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') || 'http://localhost:4000/api';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const err: any = new Error(body?.error || body?.message || res.statusText);
    err.status = res.status;
    err.details = body?.details;
    throw err;
  }
  return body as T;
}

export const post = <T>(path: string, data: unknown, init: RequestInit = {}) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data), ...init });

export const get = <T>(path: string, init: RequestInit = {}) =>
  request<T>(path, { method: 'GET', ...init });
