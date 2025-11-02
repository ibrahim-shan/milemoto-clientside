'use client';

// Import useCallback and useEffect
import { useCallback, useEffect, useState } from 'react';

import OtpInput from 'react-otp-input';

import { verifyMfaLogin } from '@/lib/auth';
import { applyLoginResult } from '@/lib/authStorage';
import type { AuthOutputDto } from '@/types';
import { Button } from '@/ui/Button';

export function MfaPrompt({
  challengeId,
  store = 'session',
  onSuccess,
}: {
  challengeId: string;
  store?: 'local' | 'session';
  onSuccess: () => void;
}) {
  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBackup, setIsBackup] = useState(false);

  // Reset UI when a new challenge arrives
  useEffect(() => {
    setCode('');
    setErr(null);
    setLoading(false);
    setIsBackup(false);
  }, [challengeId]);

  // --- UPDATE: Wrap submit in useCallback ---
  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const codeToVerify = code.trim();

      // Basic length check
      if (loading || codeToVerify.length < 4) return;

      // Specific check for auto-submit: must be 6 digits
      if (!isBackup && codeToVerify.length !== 6) return;

      setErr(null);
      setLoading(true);
      try {
        const res: AuthOutputDto = await verifyMfaLogin({ challengeId, code: codeToVerify, rememberDevice }); // <-- UPDATE THIS
        applyLoginResult(res, store);
        onSuccess();
      } catch (e: any) {
        setErr(e?.message || 'Invalid code');
        // Clear code on error so user can re-try
        setCode('');
      } finally {
        setLoading(false);
      }
    },
    [code, isBackup, challengeId, loading, onSuccess, store],
  );
  // --- END UPDATE ---

  // --- NEW: useEffect for auto-submission ---
  useEffect(() => {
    // If not a backup code, length is 6, and not already loading
    if (!isBackup && code.length === 6 && !loading) {
      submit();
    }
  }, [code, isBackup, loading, submit]);
  // --- END NEW ---

  return (
    <form
      onSubmit={submit} // Form submit is still used for backup codes
      className="rounded-xl border p-6 text-center"
    >
      <h2 className="text-lg font-semibold">Two-Factor Verification</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        {isBackup
          ? 'Enter one of your 10-character backup codes.'
          : 'Enter the 6-digit code from your authenticator app.'}
      </p>

      {err && <p className="mt-3 text-red-600">{err}</p>}

      {isBackup ? (
        <input
          className="mt-4 w-full max-w-xs rounded border px-3 py-2 font-mono"
          placeholder="BACKUP-CODE"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\s+/g, '').slice(0, 64))}
          autoFocus
          disabled={loading} // <-- Disable when loading
          aria-label="Two-factor backup code"
        />
      ) : (
        <OtpInput
          value={code}
          onChange={setCode}
          numInputs={6}
          containerStyle="otp-input-container"
          inputStyle="otp-input-box"
          renderInput={props => (
            <input
              {...props}
              disabled={loading}
            />
          )} // <-- Disable when loading
        />
      )}

      {/* --- UPDATE: Conditional Button / Loading state --- */}
      <div className="mt-6 h-10">
        {' '}
        {/* h-10 to prevent layout shift */}
        {isBackup ? (
          // Show button for backup codes
          <Button
            type="submit"
            disabled={loading || code.trim().length < 4}
          >
            {loading ? 'Verifyingâ€¦' : 'Verify'}
          </Button>
        ) : loading ? (
          // Show loading text for 6-digit auto-submit
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">Verifyingâ€¦</p>
          </div>
        ) : null}
      </div>
      {/* --- END UPDATE --- */}

      <div className="mt-4">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => {
            setIsBackup(prev => !prev);
            setCode(''); // Clear code on toggle
            setErr(null);
          }}
          disabled={loading} // <-- Disable toggle when loading
        >
          {isBackup ? 'Use authenticator app' : 'Use a backup code'}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <input id="remember-device" type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} disabled={loading} />
        <label htmlFor="remember-device" className="text-sm text-muted-foreground">Remember this device for 30 days</label>
      </div>
    </form>
  );
}

