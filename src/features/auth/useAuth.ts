'use client';

import { useCallback, useEffect, useState } from 'react';

import { logout as apiLogout, refresh } from '@/lib/auth';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: 'user' | 'admin';
};

function base64UrlDecode(s: string): string {
  const b64 = s
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(s.length / 4) * 4, '=');
  return atob(b64);
}

function decodeJwtExp(token: string): number | null {
  if (!token) return null;
  const parts = token.split('.');
  const payloadSeg = parts[1];
  if (!payloadSeg) return null; // <-- narrow from string | undefined to string

  try {
    const json = JSON.parse(base64UrlDecode(payloadSeg)) as { exp?: unknown };
    const exp = Number(json.exp);
    return Number.isFinite(exp) ? exp : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [access, setAccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const readLocal = useCallback(() => {
    const tok = localStorage.getItem('mm_access');
    const u = localStorage.getItem('mm_user');
    setAccess(tok);
    setUser(u ? JSON.parse(u) : null);
  }, []);

  // initial load + storage sync
  useEffect(() => {
    readLocal();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mm_access' || e.key === 'mm_user') readLocal();
    };
    window.addEventListener('storage', onStorage);

    // try refresh if token missing or expired
    (async () => {
      try {
        const exp = access ? decodeJwtExp(access) : null;
        const now = Math.floor(Date.now() / 1000);
        const needs = !access || !exp || exp - now < 30;
        if (needs) {
          const r = await refresh();
          localStorage.setItem('mm_access', r.accessToken);
          // keep existing user object
          setAccess(r.accessToken);
        }
      } catch {
        localStorage.removeItem('mm_access');
        localStorage.removeItem('mm_user');
        setAccess(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem('mm_access');
      localStorage.removeItem('mm_user');
      setAccess(null);
      setUser(null);
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
