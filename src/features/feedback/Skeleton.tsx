// src/components/feedback/Skeleton.tsx
'use client';

import { cn } from '@/lib/utils';

export function Skeleton({
  className = '',
  as: Tag = 'div' as any,
}: {
  className?: string;
  as?: any;
}) {
  return (
    <Tag
      className={cn(
        'bg-foreground/10 relative isolate overflow-hidden rounded-md motion-safe:animate-pulse dark:bg-white/10',
        className,
      )}
      aria-hidden
    />
  );
}
