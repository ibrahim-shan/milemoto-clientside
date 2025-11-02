'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';

import { useAuth } from '@/hooks/useAuth';
import {
  disableMfa,
  listTrustedDevices,
  logoutAll,
  regenBackupCodes,
  revokeAllTrustedDevices,
  revokeTrustedDevice,
  startMfaSetup,
  untrustCurrentDevice,
  verifyMfaSetup,
} from '@/lib/auth';
import { setUser } from '@/lib/authStorage';
import { Button } from '@/ui/Button';

export function SecuritySettings() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'show-qr' | 'verified'>('idle');
  const [loadingEnable, setLoadingEnable] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingDisable, setLoadingDisable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mfaOn, setMfaOn] = useState<boolean>(Boolean(user?.mfaEnabled));

  const [challengeId, setChallengeId] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pwd, setPwd] = useState('');
  const [finalCode, setFinalCode] = useState('');
  // Trusted devices state
  const [devices, setDevices] = useState<
    Array<{
      id: string;
      userAgent: string | null;
      ip: string | null;
      createdAt: string | null;
      lastUsedAt: string | null;
      expiresAt: string | null;
      revokedAt: string | null;
      current: boolean;
    }>
  >([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const activeDevices = useMemo(() => devices.filter(d => !d.revokedAt), [devices]);

  // Helpers to simplify Trusted Devices display
  function formatIp(ip: string | null): string {
    if (!ip) return 'IP unknown';
    if (ip === '::1' || ip === '127.0.0.1') return 'Localhost';
    return ip;
  }

  function formatUA(ua: string | null): string {
    if (!ua) return 'Unknown device';
    const s = ua;
    // OS
    let os = 'Unknown OS';
    if (/Windows NT/i.test(s)) os = 'Windows';
    else if (/Mac OS X/i.test(s)) os = 'macOS';
    else if (/Android/i.test(s)) os = 'Android';
    else if (/(iPhone|iPad|iPod)/i.test(s)) os = 'iOS';
    else if (/Linux/i.test(s)) os = 'Linux';

    // Browser (Edge > Chrome > Firefox > Safari)
    let browser = 'Browser';
    let ver: string | null = null;

    const verOf = (marker: string): string | null => {
      const m = s.match(new RegExp(marker.replace('/', '\\/') + '(\\d+)'));
      return m && m[1] ? m[1] : null; // Explicitly check for m[1]
    };

    if (/Edg\//.test(s)) {
      browser = 'Edge';
      ver = verOf('Edg/');
    } else if (/Chrome\//.test(s)) {
      browser = 'Chrome';
      ver = verOf('Chrome/');
    } else if (/Firefox\//.test(s)) {
      browser = 'Firefox';
      ver = verOf('Firefox/');
    } else if (/Safari\//.test(s)) {
      browser = 'Safari';
      ver = verOf('Version/');
    }

    return `${browser}${ver ? ' ' + ver : ''} on ${os}`;
  }

  function relativeFrom(iso: string | null): string {
    if (!iso) return 'n/a';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return 'n/a';
    let s = Math.round((Date.now() - t) / 1000);
    const ago = s >= 0;
    s = Math.abs(s);
    const mins = Math.floor(s / 60);
    const hours = Math.floor(s / 3600);
    const days = Math.floor(s / 86400);
    const weeks = Math.floor(s / 604800);
    const months = Math.floor(s / 2592000);
    const years = Math.floor(s / 31536000);
    let out: string;
    if (s < 60) out = 'just now';
    else if (mins < 60) out = `${mins} min${mins === 1 ? '' : 's'} ${ago ? 'ago' : ''}`;
    else if (hours < 24) out = `${hours} hour${hours === 1 ? '' : 's'} ${ago ? 'ago' : ''}`;
    else if (days < 7) out = `${days} day${days === 1 ? '' : 's'} ${ago ? 'ago' : ''}`;
    else if (weeks < 5) out = `${weeks} week${weeks === 1 ? '' : 's'} ${ago ? 'ago' : ''}`;
    else if (months < 12) out = `${months} month${months === 1 ? '' : 's'} ${ago ? 'ago' : ''}`;
    else out = `${years} year${years === 1 ? '' : 's'} ${ago ? 'ago' : ''}`;
    return out.trim();
  }

  function relativeUntil(iso: string | null): string {
    if (!iso) return 'n/a';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return 'n/a';
    let s = Math.round((t - Date.now()) / 1000);
    const ahead = s >= 0;
    s = Math.abs(s);
    const mins = Math.floor(s / 60);
    const hours = Math.floor(s / 3600);
    const days = Math.floor(s / 86400);
    const weeks = Math.floor(s / 604800);
    const months = Math.floor(s / 2592000);
    const years = Math.floor(s / 31536000);
    let out: string;
    if (s < 60) out = 'moments';
    else if (mins < 60) out = `${mins} min${mins === 1 ? '' : 's'}`;
    else if (hours < 24) out = `${hours} hour${hours === 1 ? '' : 's'}`;
    else if (days < 7) out = `${days} day${days === 1 ? '' : 's'}`;
    else if (weeks < 5) out = `${weeks} week${weeks === 1 ? '' : 's'}`;
    else if (months < 12) out = `${months} month${months === 1 ? '' : 's'}`;
    else out = `${years} year${years === 1 ? '' : 's'}`;
    return ahead ? `in ${out}` : `${out} ago`;
  }

  function parseErr(e: any): { code?: string; message: string } {
    const code = e?.code || e?.error;
    const message = e?.message || 'Request failed';
    return { code, message };
  }

  useEffect(() => {
    setMfaOn(Boolean(user?.mfaEnabled));
    if (user?.mfaEnabled) setStep('verified');
    if (user) void refreshDevices();
  }, [user]);

  async function refreshDevices() {
    setLoadingDevices(true);
    try {
      const res = await listTrustedDevices();
      setDevices(res.items);
    } catch (e: any) {
      // ignore
    } finally {
      setLoadingDevices(false);
    }
  }

  async function begin() {
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
        setMfaOn(true);
        setStep('verified');
      } else {
        const { message } = parseErr(e);
        toast.error(message || 'Failed to start setup');
      }
    } finally {
      setLoading(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    setLoadingDisable(true);
    let timedOut = false;
    const t = setTimeout(() => {
      timedOut = true;
      setLoadingDisable(false);
      toast.error('Verification is taking too long. Please try again.');
    }, 15000);
    try {
      const res = await verifyMfaSetup({ challengeId, code: code.trim() });
      setBackupCodes(res.backupCodes);
      setChallengeId('');
      setOtpauthUrl('');
      setSecret('');
      setCode('');
      setStep('verified');
      setMfaOn(true);
      if (user) setUser({ ...user, mfaEnabled: true });
      toast.success('Two-factor enabled');
      setLoadingDisable(false);
    } catch (e: any) {
      const { code: c, message } = parseErr(e);
      if (c === 'InvalidCode') toast.error('Invalid 6-digit code');
      else toast.error(message || 'Failed to verify');
    } finally {
      if (!timedOut) {
        clearTimeout(t);
        setLoadingVerify(false);
      }
    }
  }

  async function regen() {
    setLoading(true);
    try {
      const res = await regenBackupCodes();
      setBackupCodes(res.backupCodes);
      toast.success('Backup codes regenerated');
    } catch (e: any) {
      const { message } = parseErr(e);
      toast.error(message || 'Failed to regenerate codes');
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

  async function disable() {
    setLoadingDisable(true); // <-- FIX: Use correct state setter
    try {
      await disableMfa({ password: pwd, code: finalCode.trim() });
      setStep('idle');
      setBackupCodes(null);
      setPwd('');
      setFinalCode('');
      setMfaOn(false);
      if (user) setUser({ ...user, mfaEnabled: false });
      toast.success('Two-factor disabled');
      setLoadingVerify(false);
    } catch (e: any) {
      const { code: c, message } = parseErr(e);
      if (c === 'InvalidPassword') toast.error('Invalid password');
      else if (c === 'InvalidCode') toast.error('Invalid 2FA or backup code');
      else toast.error(message || 'Failed to disable 2FA');
    } finally {
      setLoadingDisable(false); // <-- FIX: Use correct state setter
    }
  }

  async function untrustCurrent() {
    setLoading(true);
    try {
      await untrustCurrentDevice();
      toast.success('This device is no longer trusted');
      await refreshDevices();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to untrust device');
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    setLoading(true);
    try {
      await revokeTrustedDevice(id);
      toast.success('Trusted device revoked');
      await refreshDevices();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to revoke');
    } finally {
      setLoading(false);
    }
  }

  async function revokeAll() {
    setLoading(true);
    try {
      await revokeAllTrustedDevices();
      toast.success('All trusted devices revoked');
      await refreshDevices();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to revoke all');
    } finally {
      setLoading(false);
    }
  }

  async function logoutAllDevices() {
    setLoading(true);

    try {
      await logoutAll();
      // Clear local tokens/user and redirect to sign in
      const { clearAuth } = await import('@/lib/authStorage');
      clearAuth();
      toast.success('Logged out from all devices');
      router.replace('/signin');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to logout all');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="security">
      <h2 className="text-xl font-semibold tracking-tight">Two-Factor Authentication</h2>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        Protect your account with an authenticator app.
      </p>

      {!mfaOn && step === 'idle' && (
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-medium">Time-based One-Time Password (TOTP)</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Use Google Authenticator, 1Password, or Authy to generate codes.
          </p>
          <div className="mt-4">
            <Button
              onClick={begin}
              disabled={loadingEnable}
            >
              {loadingEnable ? 'Starting...' : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      )}

      {!mfaOn && step === 'show-qr' && (
        <div className="grid gap-6 rounded-xl border p-6 md:grid-cols-[220px_1fr]">
          <div className="rounded-md bg-white p-4">
            <QRCode
              value={otpauthUrl}
              size={192}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium">Scan this QR in your app</h3>
            <p className="text-muted-foreground mt-1 text-sm">Or enter the key manually:</p>
            <code className="bg-muted mt-2 inline-block rounded px-2 py-1 text-sm">{secret}</code>

            <form
              onSubmit={verify}
              className="mt-4"
            >
              <label className="text-muted-foreground mb-1.5 block text-sm font-medium">
                Enter 6-digit code
              </label>
              <input
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={e => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                className="border-border bg-background text-foreground mt-1 h-10 w-40 rounded-md border px-3 py-2 text-center text-sm tracking-widest outline-none"
                placeholder="123456"
                autoFocus
                autoComplete="one-time-code"
                aria-label="Authentication code"
              />
              <div className="mt-3 flex gap-3">
                <Button
                  type="submit"
                  isLoading={loadingVerify}
                  disabled={code.length !== 6}
                >
                  {loadingVerify ? 'Verifying…' : 'Verify & Enable'}
                </Button>
                <Button
                  className="w-full sm:w-auto"
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

      {mfaOn && (
        <div className="rounded-xl border p-6">
          <h3 className="text-lg font-medium">Two-Factor Authentication is ON</h3>
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

      {mfaOn && (
        <div className="mt-6 rounded-xl border p-6">
          <div>
            <h3 className="text-lg font-medium">Turn Off Two-Factor Authentication</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              To disable 2FA, enter your account password and a valid code from your authenticator
              app or a backup code.
            </p>
          </div>
          <div className="mt-4 grid max-w-sm gap-3">
            <label className="text-muted-foreground mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={pwd}
              onChange={e => {
                setPwd(e.target.value);
              }}
              className="border-border bg-background text-foreground h-10 w-full rounded-md border px-3 py-2 text-sm outline-none"
              placeholder="Your password"
              autoComplete="current-password"
            />
            <label className="text-muted-foreground mt-3 mb-1.5 block text-sm font-medium">
              2FA Code or Backup Code
            </label>
            <input
              value={finalCode}
              onChange={e => {
                setFinalCode(e.target.value);
              }}
              className="border-border bg-background text-foreground h-10 w-full rounded-md border px-3 py-2 text-sm outline-none"
              placeholder="123456 or BACK-UP-CODE"
            />
            <div className="mt-3 flex gap-3">
              <Button
                variant="solid"
                onClick={disable}
                isLoading={loadingDisable}
                disabled={!pwd || !finalCode.trim()}
              >
                {loadingDisable ? 'Disabling…' : 'Disable 2FA'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trusted Devices */}
      <div className="mt-6 rounded-xl border p-6">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-medium">Trusted Devices</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Devices trusted to bypass 2FA for 30 days.
            </p>
          </div>

          {activeDevices.length === 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-muted-foreground mt-4 text-sm">No trusted devices.</p>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  onClick={refreshDevices}
                  disabled={loadingDevices}
                >
                  {loadingDevices ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="destructive"
                  onClick={revokeAll}
                  disabled={loadingDevices || activeDevices.length === 0}
                >
                  Revoke All
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  onClick={logoutAllDevices}
                  disabled={loading}
                >
                  Logout All Devices
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ul className="mt-4 grid gap-3">
                {activeDevices.map(d => (
                  <li
                    key={d.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <div className="truncate text-sm font-bold">{formatUA(d.userAgent)}</div>
                        {d.current && (
                          <span className="text-xs text-green-600 sm:ml-2">(This device)</span>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-2 flex flex-col gap-1 text-xs sm:mt-1 sm:flex-row sm:items-center">
                        <span>{formatIp(d.ip)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Last used {relativeFrom(d.lastUsedAt || d.createdAt)}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Expires {relativeUntil(d.expiresAt)}</span>
                      </div>
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
                      {d.current ? (
                        <Button
                          className="w-full sm:w-auto"
                          variant="secondary"
                          onClick={untrustCurrent}
                          disabled={loading}
                        >
                          Untrust This Device
                        </Button>
                      ) : (
                        <Button
                          className="w-full sm:w-auto"
                          variant="secondary"
                          onClick={() => revoke(d.id)}
                          disabled={loading}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

          {/* Buttons positioned below the devices list on mobile */}
              <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  onClick={refreshDevices}
                  disabled={loadingDevices}
                >
                  {loadingDevices ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="destructive"
                  onClick={revokeAll}
                  disabled={loadingDevices || activeDevices.length === 0}
                >
                  Revoke All
                </Button>
                {/* --- ADD THIS BUTTON --- */}
                <Button 
                  className="w-full sm:w-auto" 
                  variant="outline" 
                  onClick={logoutAllDevices} 
                  disabled={loading}
                >
                  Logout All Devices
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default SecuritySettings;
