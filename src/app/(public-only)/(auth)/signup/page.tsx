'use client';

import { useMemo, useState, type HTMLProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CheckCircle2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { toast } from 'react-toastify';

import 'react-phone-number-input/style.css';

import { type E164Number } from 'libphonenumber-js';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

import GoogleButton from '@/features/auth/GoogleButton';
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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState<E164Number | undefined>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true); // Default to true

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const [rememberUI] = useState(false);

  const router = useRouter();

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

    // 1. Validate Phone (from state) - This part was already correct!
    if (phone && !isValidPhoneNumber(phone)) {
      toast.error('Please enter a valid phone number for the selected country.');
      return;
    }

    // 2. Validate other fields (all from state)
    if (!terms) return toast.error('You must accept the Terms.');
    if (password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (password !== confirm) return toast.error('Passwords do not match.');
    if (!fullName.trim()) return toast.error('Full name is required.');
    if (!email.trim()) return toast.error('Email is required.');

    if (loading) return;

    setLoading(true);
    try {
      // 3. Send data *only* from state
      await register({
        // <-- 'res' is no longer needed
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        password,
        remember,
      });

      toast.success('Account created! Please check your email to verify your account.');
      router.push('/signin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'An error occurred.');
      } else {
        toast.error('An error occurred.');
      }
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
                  onChange={e => setFullName(e.target.value)}
                  value={fullName}
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
              <div className="space-y-1">
                <label
                  htmlFor="phone"
                  className="text-muted-foreground text-sm"
                >
                  Phone number
                </label>

                <div className="PhoneField">
                  <PhoneInput
                    id="phone"
                    name="phone"
                    international
                    defaultCountry="LB"
                    countrySelectProps={
                      { 'aria-label': 'Country code' } as HTMLProps<HTMLSelectElement>
                    }
                    numberInputProps={
                      { 'aria-label': 'Phone number' } as HTMLProps<HTMLInputElement>
                    }
                    value={phone}
                    onChange={setPhone}
                    limitMaxLength
                  />
                </div>
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
              <label className="mr-4 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="accent-primary h-4 w-4"
                />
                Keep me signed in
              </label>

              {/* Terms */}
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="terms"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                  className="accent-primary mt-0.5 h-4 w-4 shrink-0"
                />
                <span>
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
                </span>
              </label>

              <Button
                type="submit"
                variant="solid"
                className="mt-4"
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
            <div className="my-4 flex items-center gap-3">
              <div className="bg-border h-px w-full" />
              <span className="text-muted-foreground text-xs">or</span>
              <div className="bg-border h-px w-full" />
            </div>

            <GoogleButton remember={rememberUI} />
          </div>
        </div>
      </div>
    </main>
  );
}
