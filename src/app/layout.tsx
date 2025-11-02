import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';

import './globals.css';

import { headers } from 'next/headers';

import { ToastContainer } from 'react-toastify';

import { GA4 } from '@/features/analytics/ga4';
import { Footer } from '@/features/layout/footer';
import { Header } from '@/features/layout/header';
import { RootProviders } from '@/providers/root-providers';
import { SplashProvider } from '@/providers/splash-provider';

import 'react-toastify/dist/ReactToastify.css';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const nonce = h.get('x-nonce') || undefined;
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable}`}
    >
      <body className={`${sora.variable} ${manrope.variable} antialiased`}>
        <RootProviders>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <SplashProvider>
            <Header />
            {children}
            <Footer />
            <GA4 nonce={nonce} />
          </SplashProvider>
        </RootProviders>
      </body>
    </html>
  );
}
