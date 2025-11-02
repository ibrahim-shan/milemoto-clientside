// src/lib/api.ts
// Ensure API base points to /api/v1
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') || 'http://localhost:4000/api';
export const API_BASE = RAW_BASE.endsWith('/api')
  ? `${RAW_BASE}/v1`
  : RAW_BASE.includes('/api/v1')
    ? RAW_BASE
    : `${RAW_BASE}/v1`;

function mergeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  const out: Record<string, string> = {};
  new Headers(h).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...mergeHeaders(init.headers) };
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include', ...init, headers });
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const code = body?.code || body?.error || res.statusText;
    const msg = body?.message || body?.error || res.statusText;
    const err = new Error(msg);
    if (err instanceof Error) {
      Object.assign(err, {
        status: res.status,
        details: body?.details,
        code,
        error: body?.error,
      });
    }
    throw err;
  }
  return body as T;
}

export const post = <OkResponseDto>(path: string, body?: any, init?: RequestInit) =>
  request<OkResponseDto>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

export const get = <OkResponseDto>(path: string, init: RequestInit = {}) =>
  request<OkResponseDto>(path, { method: 'GET', ...init });
