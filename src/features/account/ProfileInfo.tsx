'use client';

import { useAuth } from '@/hooks/useAuth';
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

  if (loading) {
    return <ProfileInfoSkeleton />;
  }

  if (!user) {
    return <p>Could not load user data.</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <InfoRow
        label="Full Name"
        value={user.fullName}
      />
      <InfoRow
        label="Email"
        value={user.email}
      />
      <InfoRow
        label="Phone Number"
        value={user.phone}
      />

      <div className="pt-2">
        <Button
          variant="outline"
          disabled // This is disabled for now, we'll add it later
        >
          Edit Profile
        </Button>
      </div>
    </div>
  );
}
