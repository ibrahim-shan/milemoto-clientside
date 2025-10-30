// src/components/feedback/SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/features/feedback/LoadingSpinner';

export function SplashScreen({
  label = 'Loading',
  minDuration = 500,
  storage = 'session', // 'session' | 'local'
}: {
  label?: string;
  minDuration?: number;
  storage?: 'session' | 'local';
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // show only once (per tab or device)
    let timer: number | undefined;

    const getStore = () => (storage === 'local' ? localStorage : sessionStorage);

    try {
      if (getStore().getItem('seen_splash')) return;
    } catch {
      // storage unavailable → still show once
    }

    setVisible(true);

    const runHide = () => {
      timer = window.setTimeout(() => {
        setVisible(false);
        try {
          getStore().setItem('seen_splash', '1');
        } catch {}
      }, minDuration);
    };

    if (document.readyState === 'complete') {
      runHide(); // <-- do NOT call cleanup immediately
    } else {
      const onLoad = () => runHide();
      window.addEventListener('load', onLoad, { once: true });
      return () => window.removeEventListener('load', onLoad);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [minDuration, storage]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-background/95 fixed inset-0 z-1000 grid place-items-center backdrop-blur"
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner
          size={28}
          label={label}
        />
        <p
          className="text-muted-foreground text-sm"
          aria-hidden
        >
          {label}
        </p>
      </div>
    </div>
  );
}
