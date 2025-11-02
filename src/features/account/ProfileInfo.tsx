'use client';

import { HTMLProps, useState } from 'react';

import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

import 'react-phone-number-input/style.css';

import { BadgeCheck } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/lib/auth';
import { setUser } from '@/lib/authStorage';
import { Button } from '@/ui/Button';

/**
 * A simple read-only form field for the profile page.
 */
function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <label className="text-muted-foreground mb-1.5 block text-sm font-medium">{label}</label>
      <div className="border-border bg-background flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
        {value || <span className="text-muted-foreground">Not set</span>}
      </div>
    </div>
  );
}

/**
 * A skeleton loader for the profile info section.
 */
function ProfileInfoSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="bg-muted-foreground/20 mb-1.5 h-5 w-24 rounded" />
        <div className="bg-muted-foreground/20 h-10 w-full rounded-md" />
      </div>
      <div>
        <div className="bg-muted-foreground/20 mb-1.5 h-5 w-20 rounded" />
        <div className="bg-muted-foreground/20 h-10 w-full rounded-md" />
      </div>
      <div>
        <div className="bg-muted-foreground/20 mb-1.5 h-5 w-32 rounded" />
        <div className="bg-muted-foreground/20 h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

/**
 * Main component to display user profile information.
 */
export function ProfileInfo() {
  const { user, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState<string | ''>(user?.phone || '');

  if (loading) {
    return <ProfileInfoSkeleton />;
  }

  if (!user) {
    return <p>Could not load user data.</p>;
  }

  const onCancel = () => {
    setEditing(false);
    setFullName(user.fullName);
    setPhone(user.phone || '');
  };

  const isDirty =
    fullName.trim() !== (user.fullName || '').trim() ||
    (phone.trim() || '') !== (user.phone || '').trim();

  const onSave = async () => {
    if (!isDirty) {
      toast.info('No changes to update.');
      setEditing(false);
      return;
    }
    if (!fullName.trim()) {
      toast.error('Full Name is required.');
      return;
    }
    if (phone && !isValidPhoneNumber(phone)) {
      toast.error('Please enter a valid phone number for the selected country.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });
      setUser(updated);
      try {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'mm:user',
            newValue: JSON.stringify(updated),
          }),
        );
      } catch {}
      toast.success('Profile updated');
      setEditing(false);
    } catch (e: unknown) {
      const status = (e as { status: number })?.status;
      const msg: string = (e as { message: string })?.message || '';
      const code = (e as { code: string })?.code || (e as { error: string })?.error;
      // Heuristics for duplicate phone coming back as 409 or 500 with driver message
      const dup =
        status === 409 ||
        (typeof msg === 'string' && /duplicate|already\s+exists|ER_DUP_ENTRY/i.test(msg)) ||
        (typeof code === 'string' && /duplicate|ER_DUP_ENTRY/i.test(code));
      if (dup && phone) {
        toast.error('Phone number is already in use.');
      } else {
        toast.error(msg || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Full Name (editable) */}
      <div>
        <label className="text-muted-foreground mb-1.5 block text-sm font-medium">Full Name</label>
        {editing ? (
          <input
            type="text"
            className="border-border bg-background text-foreground h-10 w-full rounded-md border px-3 py-2 text-sm outline-none"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            autoComplete="name"
          />
        ) : (
          <div className="border-border bg-background flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
            {user.fullName}
          </div>
        )}
      </div>

      {/* Email (read-only) */}
      <InfoRow
        label="Email"
        value={user.email}
      />
      {/* Verification badge under email */}
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <BadgeCheck
          className="h-4 w-4"
          aria-hidden
        />
        <span className="font-medium">Verified</span>
      </div>

      {/* Phone (editable) */}
      <div>
        <label className="text-muted-foreground mb-1.5 block text-sm font-medium">
          Phone Number
        </label>
        {editing ? (
          <div className="PhoneField">
            <PhoneInput
              id="phone"
              name="phone"
              international
              defaultCountry="LB"
              flags={flags}
              countrySelectProps={{ 'aria-label': 'Country code' } as HTMLProps<HTMLSelectElement>}
              numberInputProps={{ 'aria-label': 'Phone number' } as HTMLProps<HTMLInputElement>}
              value={phone || undefined}
              onChange={val => setPhone((val as string) || '')}
              limitMaxLength
            />
          </div>
        ) : (
          <div className="border-border bg-background flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
            {user.phone || <span className="text-muted-foreground">Not set</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        {!editing ? (
          <Button
            variant="outline"
            onClick={() => {
              setEditing(true);
              setFullName(user.fullName);
              setPhone(user.phone || '');
            }}
          >
            Edit Profile
          </Button>
        ) : (
          <>
            <Button
              variant="solid"
              onClick={onSave}
              disabled={saving || !isDirty}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
