import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import { Footer } from '@/components/Footer';
import { AnalyticsProvider } from '@/lib/analytics';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Suspense } from 'react';
import { QueryProvider } from '@/components/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'REYVA',
  description: 'A fully functional, production-ready, scalable e-commerce platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <QueryProvider>
            <Suspense>
              <AnalyticsProvider />
            </Suspense>
            <div className="relative flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500">
              {/* Soft 3D ambient backdrop */}
              <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-x-0 -top-40 h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />
                <div className="absolute left-[-10%] top-32 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute right-[-10%] top-64 h-80 w-80 rounded-full bg-primary/6 blur-3xl" />
              </div>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
