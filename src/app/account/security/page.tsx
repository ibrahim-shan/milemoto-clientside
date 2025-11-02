'use client';

import { useState } from 'react';

import QRCode from 'react-qr-code';

import { regenBackupCodes, startMfaSetup, verifyMfaSetup } from '@/lib/auth';
import { Button } from '@/ui/Button';

export default function SecurityPage() {
  const [step, setStep] = useState<'idle' | 'show-qr' | 'verified'>('idle');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [challengeId, setChallengeId] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  async function begin() {
    setErr(null);
    setLoading(true);
    try {
      const data = await startMfaSetup();
      setChallengeId(data.challengeId);
      setOtpauthUrl(data.otpauthUrl);
      setSecret(data.secretBase32);
      setCode('');
      setStep('show-qr');
    } catch (e: any) {
      if (typeof e.message === 'string' && e.message.includes('MFA already enabled')) {
        setStep('verified');
      } else {
        setErr(e.message || 'Failed to start setup');
      }
    } finally {
      setLoading(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await verifyMfaSetup({ challengeId, code: code.trim() });
      setBackupCodes(res.backupCodes);
      // clear QR state after enabling
      setChallengeId('');
      setOtpauthUrl('');
      setSecret('');
      setCode('');
      setStep('verified');
    } catch (e: any) {
      setErr(e.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function regen() {
    setErr(null);
    setLoading(true);
    try {
      const res = await regenBackupCodes();
      setBackupCodes(res.backupCodes);
    } catch (e: any) {
      setErr(e.message || 'Failed to regenerate codes');
    } finally {
      setLoading(false);
    }
  }

  function downloadCodes() {
    if (!backupCodes) return;
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function cancelSetup() {
    setStep('idle');
    setCode('');
    setChallengeId('');
    setOtpauthUrl('');
    setSecret('');
  }

  return (
    <main className="bg-background text-foreground min-h-dvh">
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-muted-foreground mt-1">
          Protect your account with two-factor authentication.
        </p>

        {err && <p className="mt-4 text-red-600">{err}</p>}

        {step === 'idle' && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="text-lg font-medium">Two-Factor Authentication (TOTP)</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Use an authenticator app like Google Authenticator, 1Password, or Authy.
            </p>
            <div className="mt-4">
              <Button
                onClick={begin}
                disabled={loading}
              >
                {loading ? 'Starting…' : 'Enable 2FA'}
              </Button>
            </div>
          </div>
        )}

        {step === 'show-qr' && (
          <div className="mt-6 grid gap-6 rounded-xl border p-6 md:grid-cols-[220px_1fr]">
            <div className="rounded-md bg-white p-4">
              <QRCode
                value={otpauthUrl}
                size={192}
              />
            </div>
            <div>
              <h2 className="text-lg font-medium">Scan this QR in your authenticator app</h2>
              <p className="text-muted-foreground mt-1 text-sm">Or enter the key manually:</p>
              <code className="bg-muted mt-2 inline-block rounded px-2 py-1 text-sm">{secret}</code>

              <form
                onSubmit={verify}
                className="mt-4"
              >
                <label className="block text-sm font-medium">Enter 6-digit code</label>
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 w-40 rounded border px-3 py-2"
                  placeholder="123456"
                  autoFocus
                  autoComplete="one-time-code"
                  aria-label="Authentication code"
                />
                <div className="mt-3 flex gap-3">
                  <Button
                    type="submit"
                    disabled={loading || code.length !== 6}
                  >
                    {loading ? 'Verifying…' : 'Verify & Enable'}
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={cancelSetup}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === 'verified' && (
          <div className="mt-6 rounded-xl border p-6">
            <h2 className="text-lg font-medium">Two-Factor Authentication is ON</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Keep your backup codes in a safe place.
            </p>

            {backupCodes && (
              <div className="mt-4">
                <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map(c => (
                    <li
                      key={c}
                      className="rounded border px-3 py-2"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-3">
                  <Button onClick={downloadCodes}>Download .txt</Button>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={regen}
                disabled={loading}
              >
                {loading ? 'Generating…' : 'Regenerate Backup Codes'}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
