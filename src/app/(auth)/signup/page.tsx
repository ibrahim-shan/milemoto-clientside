'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone as PhoneIcon,
  ShieldCheck,
  User,
} from 'lucide-react';

import { register } from '@/lib/auth';
import { Button } from '@/ui/Button';

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}

export default function SignUpPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwdScore = useMemo(() => scorePassword(password), [password]);

  const strengthMap = [
    { label: 'Too short', bar: 'bg-error', chip: 'bg-error/10 text-error border-error/20' },
    { label: 'Weak', bar: 'bg-error', chip: 'bg-error/10 text-error border-error/20' },
    { label: 'Fair', bar: 'bg-warning', chip: 'bg-warning/10 text-warning border-warning/20' },
    { label: 'Good', bar: 'bg-info', chip: 'bg-info/10 text-info border-info/20' },
    { label: 'Strong', bar: 'bg-success', chip: 'bg-success/10 text-success border-success/20' },
  ] as const;
  type StrengthIdx = 0 | 1 | 2 | 3 | 4;

  const idx = Math.min(Math.max(pwdScore, 0), 4) as StrengthIdx;
  const strength = strengthMap[idx];
  const fill = (idx / 4) * 100;

  const match = confirm.length === 0 ? true : password === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') || '').trim();
    const email = String(f.get('email') || '')
      .trim()
      .toLowerCase();
    const phone = String(f.get('phone') || '').trim() || null;
    const pw = String(f.get('password') || '');
    const cf = String(f.get('confirm') || '');
    const terms = f.get('terms') === 'on';

    if (!terms) return setError('You must accept the Terms.');
    if (pw.length < 8) return setError('Password must be at least 8 characters.');
    if (pw !== cf) return setError('Passwords do not match.');
    if (!name) return setError('Full name is required.');

    setError(null);
    setLoading(true);
    try {
      const res = await register({ fullName: name, email, phone, password: pw });

      // Persist access token for API calls from the app. Refresh token is cookie (httpOnly).
      localStorage.setItem('mm_access', res.accessToken);
      // Optional: store user snapshot
      localStorage.setItem('mm_user', JSON.stringify(res.user));

      // Redirect to account or previous page
      router.push('/account');
    } catch (err: any) {
      if (err?.status === 409) setError('Email is already registered.');
      else if (err?.status === 400 && err?.details?.fieldErrors) {
        // Zod-style details from backend error handler
        const first = Object.values(err.details.fieldErrors as Record<string, string[]>).flat()[0];
        setError(first || 'Invalid input.');
      } else if (err?.message) setError(err.message);
      else setError('Sign up failed. Try again.');
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
            aria-labelledby="benefits-title"
            className="border-border hidden border-r p-8 md:block"
          >
            <h2
              id="benefits-title"
              className="sr-only"
            >
              Account benefits
            </h2>
            <h1
              id="auth-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Create your account
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Faster checkout and order tracking.
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">Secure authentication</p>
                  <p className="text-muted-foreground text-xs">
                    We protect your data with industry standards.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">Easy account management</p>
                  <p className="text-muted-foreground text-xs">
                    Edit profile, addresses, and preferences.
                  </p>
                </div>
              </li>
            </ul>
            <div className="border-border text-muted-foreground mt-8 rounded-lg border border-dashed p-4 text-xs">
              By continuing you agree to our{' '}
              <Link
                href="/terms"
                className="text-primary underline underline-offset-4"
              >
                Terms
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-primary underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </div>
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
              aria-labelledby="signup-form-title"
              onSubmit={onSubmit}
              className="space-y-4"
              noValidate
            >
              {/* Name */}
              <div className="relative">
                <User
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4"
                />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder=" "
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                />
                <label
                  htmlFor="name"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Full name
                </label>
              </div>

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

              {/* Phone */}
              <div className="relative">
                <PhoneIcon
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4"
                />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder=" "
                  dir="ltr"
                  pattern="^[+0-9()\-\\s]{7,20}$"
                  title="Enter a valid phone number"
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                />
                <label
                  htmlFor="phone"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Phone number
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
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=" "
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 pr-10 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                  aria-describedby="pw-help pw-strength"
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
                <p
                  id="pw-help"
                  className="text-muted-foreground mt-1 text-xs"
                >
                  Use 8+ chars with upper, lower, number, and symbol.
                </p>
                <div
                  id="pw-strength"
                  className="mt-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength:</span>
                    <span
                      aria-live="polite"
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${strength.chip}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${strength.bar}`} />
                      {strength.label}
                    </span>
                  </div>

                  <div className="bg-muted/50 mt-1 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full ${strength.bar} transition-[width,background-color] duration-300`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Confirm */}
              <div className="relative">
                <Lock
                  aria-hidden
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4"
                />
                <input
                  id="confirm"
                  name="confirm"
                  type={showPass2 ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder=" "
                  className="peer border-input bg-background text-foreground ring-ring/0 w-full rounded-md border px-9 py-2 pr-10 text-sm outline-none placeholder:text-transparent focus-visible:ring-2"
                  aria-invalid={!match}
                />
                <label
                  htmlFor="confirm"
                  className="text-muted-foreground pointer-events-none absolute top-2.5 left-9 px-1 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-sm peer-focus:-top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Confirm password
                </label>
                <button
                  type="button"
                  aria-label={showPass2 ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPass2(s => !s)}
                  className="text-muted-foreground hover:text-foreground absolute top-1.5 right-2 inline-flex h-7 w-7 items-center justify-center rounded"
                >
                  {showPass2 ? (
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
                {!match && (
                  <p
                    role="alert"
                    className="text-error mt-1 text-xs"
                  >
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="mt-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="terms"
                  className="accent-primary h-4 w-4"
                />
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="text-primary underline underline-offset-4"
                >
                  Terms
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="text-primary underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                .
              </label>

              {error && (
                <p
                  role="alert"
                  className="text-error mt-2 text-sm"
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
                Create account
              </Button>

              <p className="text-muted-foreground mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link
                  href="/signin"
                  className="text-primary underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
