import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { PageTitleProvider } from '@/contexts/page-title-context';
import { SolanaWalletProvider } from '@/contexts/wallet-context';
import { NavigationProvider } from '@/components/layout/navigation-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'POAP',
  description: 'Manage Proof of Attendance Protocol tokens for your events',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-neutral-50`}
      >
        <NavigationProvider>
          <SolanaWalletProvider>
            <PageTitleProvider>
              <Header />
              <main className="pt-4">{children}</main>
            </PageTitleProvider>
            <Toaster position="bottom-right" closeButton richColors expand theme="light" />
          </SolanaWalletProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
