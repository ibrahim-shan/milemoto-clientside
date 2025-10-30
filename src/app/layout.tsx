import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';

import './globals.css';

import { GA4 } from '@/features/analytics/ga4';
import { Footer } from '@/features/layout/footer';
import { Header } from '@/features/layout/header';
import { RootProviders } from '@/providers/root-providers';
import { SplashProvider } from '@/providers/splash-provider';

const sora = Sora({
  variable: '--font-sora',
  weight: ['600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const manrope = Manrope({
  variable: '--font-manrope',
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MileMoto — Auto Parts Shop',
    template: '%s · MileMoto',
  },
  description: 'Quality auto parts with fast checkout and trusted brands.',
  metadataBase: new URL('https://milemoto.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable}`}
    >
      <body className={`${sora.variable} ${manrope.variable} antialiased`}>
        <RootProviders>
          <SplashProvider>
            <Header />
            {children}
            <Footer />
            <GA4 />
          </SplashProvider>
        </RootProviders>
      </body>
    </html>
  );
}
