import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PageTitleProvider } from '@/contexts/page-title-context';
import { cn } from '@/lib/utils';
import './globals.css';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { SolanaWalletProvider } from '@/contexts/wallet-context';
import { NavigationProvider } from '@/components/layout/navigation-context';

const inter = Inter({ subsets: ['latin'] });

// App name constant to ensure consistency
export const APP_NAME = 'POAP Platform';

export const metadata: Metadata = {
  title: {
    template: '%s | POAP Platform',
    default: 'POAP Platform | Create Digital Proof of Attendance Tokens',
  },
  description:
    'Create, distribute and manage digital proof of attendance tokens that your community will love to collect and share.',
  keywords: [
    'POAP',
    'proof of attendance',
    'blockchain',
    'digital collectibles',
    'events',
    'tokens',
    'NFT',
    'community',
  ],
  authors: [{ name: 'POAP Platform' }],
  creator: 'POAP Platform',
  publisher: 'POAP Platform',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://poapplatform.com',
    title: 'POAP Platform | Create Digital Proof of Attendance Tokens',
    description:
      'Create, distribute and manage digital proof of attendance tokens that your community will love to collect and share.',
    siteName: 'POAP Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POAP Platform | Create Digital Proof of Attendance Tokens',
    description:
      'Create memorable digital tokens for your events with our easy-to-use POAP platform.',
    creator: '@poapplatform',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://poapplatform.com',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD structured data for better SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'POAP Platform',
              url: 'https://poapplatform.com',
              description: 'Create, distribute and manage digital proof of attendance tokens.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://poapplatform.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'POAP Platform',
              url: 'https://poapplatform.com',
              logo: 'https://poapplatform.com/logo.png',
              sameAs: ['https://twitter.com/poapplatform', 'https://discord.gg/poapplatform'],
            }),
          }}
        />
      </head>
      <body className={cn(inter.className, 'min-h-screen bg-white dark:bg-neutral-950')}>
        <NavigationProvider>
          <SolanaWalletProvider>
            <PageTitleProvider>
              <Header />
              <main className="pt-4">{children}</main>
            </PageTitleProvider>
          </SolanaWalletProvider>
        </NavigationProvider>
        <Toaster position="bottom-right" closeButton richColors expand theme="light" />
      </body>
    </html>
  );
}
