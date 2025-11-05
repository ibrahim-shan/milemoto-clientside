// src/app/reset-password/page.tsx
'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Eye, EyeOff, Lock } from 'lucide-react';

import { resetPassword } from '@/lib/auth';
import { Button } from '@/ui/Button';

// Suspense wrapper is required because we use useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const match = password === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (loading || success) return;
    if (!token) return setError('Invalid or missing token.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (!match) return setError('Passwords do not match.');

    setLoading(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true); // Show success message
    } catch {
      setError('Invalid or expired token. Please request a new link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-background text-foreground mx-auto grid min-h-dvh max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-border bg-card w-full max-w-md rounded-2xl border p-6 shadow-sm md:p-8">
        {success ? (
          // --- VIEW 2: SUCCESS MESSAGE ---
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Password Reset</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Your password has been successfully updated.
            </p>
            <Button
              href="/signin"
              variant="solid"
              justify="center"
              className="mt-6"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          // --- VIEW 1: THE FORM ---
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
            <p className="text-muted-foreground mt-2 text-sm">Enter your new password below.</p>

            <form
              onSubmit={onSubmit}
              className="mt-6 space-y-4"
            >
              {/* New Password */}
              <div className="relative">
                <Lock
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4"
                />
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=" "
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 pr-10 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                />
                <label
                  htmlFor="password"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  New Password
                </label>
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass(s => !s)}
                  className="text-muted-foreground hover:text-foreground absolute top-1.5 right-2 inline-flex h-7 w-7 items-center justify-center rounded"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm New Password */}
              <div className="relative">
                <Lock
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4"
                />
                <input
                  id="confirm"
                  name="confirm"
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder=" "
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 pr-10 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                />
                <label
                  htmlFor="confirm"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Confirm New Password
                </label>
              </div>

              {!match && confirm.length > 0 && (
                <p
                  role="alert"
                  className="text-error text-sm"
                >
                  Passwords do not match.
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="text-error text-sm"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="solid"
                className="mt-2"
                size="md"
                fullWidth
                isLoading={loading}
                disabled={!match || password.length < 8}
              >
                Set New Password
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
