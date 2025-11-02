// src/app/verify-email/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { CheckCircle, XCircle } from 'lucide-react';

import { verifyEmail } from '@/lib/auth';
import { Button } from '@/ui/Button';

// We must wrap the component in Suspense to use useSearchParams
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<StatusDisplay status="loading" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token found.');
      return;
    }

    // This effect runs once on page load
    verifyEmail(token)
      .then(() => {
        setStatus('success');
      })
      .catch(err => {
        setStatus('error');
        setError(err?.message || 'Invalid or expired token.');
      });
  }, [token]);

  return (
    <StatusDisplay
      status={status}
      error={error}
    />
  );
}

// A simple component to show the UI for each state
function StatusDisplay({ status, error }: { status: Status; error?: string | null }) {
  let content = {
    title: 'Verifying...',
    message: 'Please wait while we verify your email address.',
    icon: (
      <div className="border-muted-foreground/20 border-t-primary h-12 w-12 animate-spin rounded-full border-4" />
    ),
    button: (
      <Button
        href="/"
        variant="outline"
      >
        Go to Home
      </Button>
    ),
  };

  if (status === 'success') {
    content = {
      title: 'Email Verified!',
      message: 'Your email address has been successfully verified.',
      icon: <CheckCircle className="text-success h-12 w-12" />,
      button: (
        <Button
          href="/signin"
          variant="solid"
        >
          Continue to Sign In
        </Button>
      ),
    };
  }

  if (status === 'error') {
    content = {
      title: 'Verification Failed',
      message: error || 'This link is invalid or has expired. Please try registering again.',
      icon: <XCircle className="text-error h-12 w-12" />,
      button: (
        <Button
          href="/"
          variant="outline"
        >
          Go to Home
        </Button>
      ),
    };
  }

  return (
    <main className="bg-background text-foreground grid min-h-dvh place-items-center px-6 py-16">
      <section className="border-border bg-card w-full max-w-md rounded-2xl border p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center">{content.icon}</div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{content.message}</p>
        <div className="mt-8">{content.button}</div>
      </section>
    </main>
  );
}
