import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NexCart | Modern E-Commerce',
  description: 'A fully functional, production-ready, scalable e-commerce platform.',
};

import { Footer } from '@/components/Footer';
import { AnalyticsProvider } from '@/lib/analytics';

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AnalyticsProvider />
          <div className="relative flex min-h-screen flex-col bg-white dark:bg-[#050505] text-slate-900 dark:text-slate-100 transition-colors duration-500">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
