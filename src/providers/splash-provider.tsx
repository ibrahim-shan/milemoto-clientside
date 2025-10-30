// src/providers/splash-provider.tsx
'use client';

import type { PropsWithChildren } from 'react';

import { SplashScreen } from '@/features/feedback/SplashScreen';

export function SplashProvider({ children }: PropsWithChildren) {
  return (
    <>
      <SplashScreen label="Starting MileMoto" />
      {children}
    </>
  );
}
