// src/app/signin/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

import { login } from '@/lib/auth';
import { Button } from '@/ui/Button';

export default function SignInPage() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = search.get('next') || '/account';
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '')
      .trim()
      .toLowerCase();
    const password = String(f.get('password') || '');

    if (!email || !password) return setError('Email and password are required.');
    setError(null);
    setLoading(true);

    try {
      const res = await login({ email, password });
      localStorage.setItem('mm_access', res.accessToken);
      localStorage.setItem('mm_user', JSON.stringify(res.user));
      router.push(nextUrl);
    } catch (err: any) {
      if (err?.status === 401) setError('Invalid email or password.');
      else if (err?.status === 403) setError('Account disabled.');
      else setError(err?.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="bg-background text-foreground mx-auto grid min-h-dvh max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-border bg-card w-full max-w-7xl rounded-2xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: value prop */}
          <aside
            aria-labelledby="signin-benefits"
            className="border-border hidden border-r p-8 md:block"
          >
            <h2
              id="signin-benefits"
              className="sr-only"
            >
              Account benefits
            </h2>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Access your orders, wishlist, and more.
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">Secure sessions</p>
                  <p className="text-muted-foreground text-xs">
                    We use industry-standard protection.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">Fast checkout</p>
                  <p className="text-muted-foreground text-xs">Save time on every purchase.</p>
                </div>
              </li>
            </ul>
          </aside>

          {/* Right: form */}
          <div className="p-6 md:p-8">
            {/* Social */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="justify-center"
              >
                <svg
                  aria-hidden
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  focusable="false"
                >
                  <path
                    d="M21.35 11.1H12v2.9h5.35c-.24 1.5-1.8 4.4-5.35 4.4A6.3 6.3 0 0 1 5.7 12a6.3 6.3 0 0 1 6.3-6.4c1.8 0 3.05.75 3.75 1.4l2.55-2.45C16.9 3.1 14.7 2.2 12 2.2 6.9 2.2 2.7 6.45 2.7 11.5S6.9 20.8 12 20.8c7.2 0 8.6-6.05 7.95-9.7z"
                    fill="currentColor"
                  />
                </svg>
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="justify-center"
              >
                <svg
                  aria-hidden
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  focusable="false"
                >
                  <path
                    d="M12 2C6.48 2 2 6.6 2 12.24c0 4.5 2.87 8.3 6.84 9.64.5.1.68-.23.68-.5v-1.77c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.1-.67.36-1.12.65-1.38-2.22-.26-4.56-1.15-4.56-5.11 0-1.13.39-2.05 1.03-2.78-.1-.26-.45-1.32.1-2.75 0 0 .84-.28 2.75 1.06a9 9 0 0 1 5 0c1.9-1.34 2.74-1.06 2.74-1.06.55 1.43.2 2.5.1 2.75.64.73 1.03 1.65 1.03 2.78 0 3.97-2.35 4.85-4.58 5.1.37.33.7.99.7 2v2.96c0 .28.18.6.69.5A10.07 10.07 0 0 0 22 12.25C22 6.6 17.52 2 12 2z"
                    fill="currentColor"
                  />
                </svg>
                Continue with GitHub
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="bg-border h-px w-full" />
              <span className="text-muted-foreground text-xs">or</span>
              <div className="bg-border h-px w-full" />
            </div>

            <form
              aria-labelledby="signin-form-title"
              onSubmit={onSubmit}
              className="space-y-4"
              noValidate
            >
              <h2
                id="signin-form-title"
                className="sr-only"
              >
                Sign in form
              </h2>

              {/* Email */}
              <div className="relative">
                <Mail
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder=" "
                  dir="ltr"
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                />
                <label
                  htmlFor="email"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Email
                </label>
              </div>

              {/* Password */}
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
                  autoComplete="current-password"
                  placeholder=" "
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 pr-10 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                />
                <label
                  htmlFor="password"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Password
                </label>
                <button
                  type="button"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass(s => !s)}
                  className="text-muted-foreground hover:text-foreground absolute top-1.5 right-2 inline-flex h-7 w-7 items-center justify-center rounded"
                >
                  {showPass ? (
                    <EyeOff
                      className="h-4 w-4"
                      aria-hidden
                    />
                  ) : (
                    <Eye
                      className="h-4 w-4"
                      aria-hidden
                    />
                  )}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="remember"
                    className="accent-primary h-4 w-4"
                  />
                  Remember me
                </label>
                <Link
                  href="/forgot"
                  className="text-primary underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-error mt-1 text-sm"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="solid"
                size="md"
                fullWidth
              >
                Sign in
              </Button>

              <p className="text-muted-foreground mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-primary underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
