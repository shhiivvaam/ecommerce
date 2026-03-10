import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/QueryProvider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://admin.reyva.co.in'),
  title: {
    default: 'Reyva Admin',
    template: '%s | Reyva Admin'
  },
  description: 'Reyva internal staff portal — not for public access.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <SettingsProvider>
            <Suspense>
              {children}
            </Suspense>
            <Toaster position="bottom-right" />
          </SettingsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
