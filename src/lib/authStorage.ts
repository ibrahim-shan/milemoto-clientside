// src/lib/authStorage.ts
import type { UserDto } from '@/types';

type StoreMode = 'local' | 'session';

const STORE_KEY = 'mm:store'; // where to keep auth ('local' or 'session')
const TOKEN_KEY = 'mm:access'; // access token
const USER_KEY = 'mm:user'; // serialized user

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeStorage(mode: StoreMode): Storage | null {
  if (!isBrowser()) return null;
  try {
    return mode === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function getStoreMode(): StoreMode {
  if (!isBrowser()) return 'session';
  const raw = window.localStorage.getItem(STORE_KEY);
  return raw === 'local' || raw === 'session' ? raw : 'session';
}

export function setStoreMode(mode: StoreMode) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORE_KEY, mode);
}

function current(): Storage | null {
  if (!isBrowser()) return null;
  return safeStorage(getStoreMode());
}

export function getAccessToken(): string | null {
  const s = current();
  return s ? s.getItem(TOKEN_KEY) : null;
}

export function setAccessToken(token: string | null) {
  const s = current();
  if (!s) return;
  if (token) s.setItem(TOKEN_KEY, token);
  else s.removeItem(TOKEN_KEY);
}

export function setAuth(
  payload: { accessToken: string; user: UserDto },
  store: StoreMode = 'session',
) {
  applyLoginResult(payload, store);
}

export function getUser<T = unknown>(): T | null {
  const s = current();
  const raw = s ? s.getItem(USER_KEY) : null;
  if (raw) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export function setUser(user: UserDto | null) {
  const s = current();
  if (!s) return;
  if (user) s.setItem(USER_KEY, JSON.stringify(user));
  else s.removeItem(USER_KEY);
}

/** Convenience: set storage mode, then store token+user together. */
export function applyLoginResult(
  payload: { accessToken: string; user: UserDto },
  store: StoreMode = 'session',
) {
  setStoreMode(store);
  const s = safeStorage(store);
  if (!s) return;
  s.setItem(TOKEN_KEY, payload.accessToken);
  s.setItem(USER_KEY, JSON.stringify(payload.user));

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'mm:access', // The key the hook is listening for
      newValue: payload.accessToken,
    }),
  );
}

export function clearAuth() {
  if (!isBrowser()) return;
  // Clear from BOTH just in case
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
  } catch {}

  // Reset store mode to session
  setStoreMode('session');

  // Notify all tabs of logout
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'mm:access',
      newValue: null,
      storageArea: window.localStorage,
    }),
  );
}
