// src/lib/api.ts
// Ensure API base points to /api/v1
// Prefer same-origin relative API base for dev; proxy via Next.js rewrites
import { setAccessToken } from './authStorage';
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') || '/api';
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

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

async function request<T>(path: string, init: RequestInit, triedRefresh = false): Promise<T> {
  const headers = { 'Content-Type': 'application/json', ...mergeHeaders(init.headers) };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (init as any)?.timeout ?? DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      const err = new Error('Request timed out');
      (err as any).status = 0;
      (err as any).code = 'Timeout';
      clearTimeout(timeout);
      throw err;
    }
    clearTimeout(timeout);
    throw e;
  } finally {
    // ensure timeout cleared if fetch resolves or throws synchronously
  }
  clearTimeout(timeout);
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    // On 401, attempt a single refresh then retry (except when calling refresh itself)
    if (res.status === 401 && !triedRefresh && !path.startsWith('/auth/refresh')) {
      const newTok = await refreshAccessToken();
      if (newTok) {
        const retryHeaders = { ...headers, Authorization: `Bearer ${newTok}` };
        return request<T>(path, { ...init, headers: retryHeaders }, true);
      }
    }
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
