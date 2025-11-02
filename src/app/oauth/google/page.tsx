'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { applyLoginResult } from '@/lib/authStorage';
import type { UserDto } from '@/types';

// ... (b64urlToString function remains the same) ...
function b64urlToString(s: string) {
  const b64 = s
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(s.length / 4) * 4, '=');
  if (typeof window === 'undefined') return '';
  try {
    return atob(b64);
  } catch {
    return '';
  }
}

export default function GoogleOAuthHandler() {
  const router = useRouter();

  useEffect(() => {
    try {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const p = new URLSearchParams(hash);

      // --- Check for MFA case FIRST ---
      if (p.has('mfaRequired')) {
        const challengeId = p.get('challengeId');
        const store = p.get('store') || 'session';
        const next = p.get('next') || '/account';

        if (challengeId) {
          // --- THIS IS THE CHANGE ---
          // Redirect to the MAIN signin page with MFA params
          const mfaUrl = new URL('/signin', window.location.origin);
          mfaUrl.searchParams.set('mfaChallengeId', challengeId); // <-- Use new param name
          mfaUrl.searchParams.set('store', store);
          mfaUrl.searchParams.set('next', next);
          router.replace(mfaUrl.toString());
          // --- END CHANGE ---
          return;
        }
      }

      // ... (Original success case remains the same) ...
      const accessToken = p.get('accessToken') || '';
      const userB64 = p.get('user') || '';
      const next = p.get('next') || '/account';
      const store = p.get('store') === 'local' ? 'local' : 'session';

      if (!accessToken || !userB64) {
        router.replace('/signin');
        return;
      }

      const userJson = b64urlToString(userB64);
      const user: UserDto = JSON.parse(userJson);
      applyLoginResult({ accessToken, user }, store);
      router.replace(next);
    } catch {
      router.replace('/signin');
    }
  }, [router]);

  return (
    // ... (no changes to the loading JSX) ...
    <main className="bg-background text-foreground grid min-h-dvh place-items-center px-6 py-16">
      <section className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">{'Signing you in…'}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {'Please wait while we finalize your session.'}
        </p>
      </section>
    </main>
  );
}
