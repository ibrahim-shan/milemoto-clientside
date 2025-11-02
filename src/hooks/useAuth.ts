// src/hooks/useAuth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

import { logout as apiLogout, refresh } from '@/lib/auth';
import {
  clearAuth,
  getAccessToken,
  getUser,
  setAccessToken,
  setStoreMode,
} from '@/lib/authStorage';
import type { UserDto } from '@/types';

// This function now decodes the token from authStorage
function decodeJwtExp(token: string): number | null {
  if (!token) return null;
  const parts = token.split('.');
  const payloadSeg = parts[1];
  if (!payloadSeg) return null;
  try {
    // Re-implementing b64urlDecode locally to avoid import cycle
    const b64 = payloadSeg
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadSeg.length / 4) * 4, '=');
    const json = JSON.parse(atob(b64)) as { exp?: unknown };
    const exp = Number(json.exp);
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [access, setAccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-reads from the single source of truth (authStorage)
  const readStores = useCallback(() => {
    setAccess(getAccessToken());
    setUser(getUser<UserDto>());
  }, []);

  // Sync state on load and on tab changes
  useEffect(() => {
    readStores();
    const onStorage = (e: StorageEvent) => {
      // Listen for changes from other tabs
      if (e.key === 'mm:store' || e.key === 'mm:access' || e.key === 'mm:user') {
        readStores();
      }
    };
    window.addEventListener('storage', onStorage);

    // This auto-refresh logic is now correctly integrated
    (async () => {
      try {
        const tok = getAccessToken(); // <-- Use new getter
        const exp = tok ? decodeJwtExp(tok) : null;
        const now = Math.floor(Date.now() / 1000);
        const needs = !tok || !exp || exp - now < 30; // 30-sec buffer

        if (needs) {
          const r = await refresh();
          setAccessToken(r.accessToken); // <-- Use new setter
          setAccess(r.accessToken);
        }
      } catch {
        clearAuth(); // <-- Use new clear function
        setAccess(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logout now uses the correct clear function
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearAuth(); // <-- Use new clear function
      setAccess(null);
      setUser(null);
      // Also reset the store preference to session
      setStoreMode('session');
    }
  }, []);

  return {
    user,
    accessToken: access,
    isAuthenticated: Boolean(user && access),
    loading,
    logout,
  };
}
