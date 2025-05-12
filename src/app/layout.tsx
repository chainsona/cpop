import type { Metadata, Viewport } from 'next';
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
export const APP_NAME = 'POP';
// Base URL for the application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cpop.maikers.com';

export const metadata: Metadata = {
  title: {
    template: '%s | POP',
    default: 'POP | Create Digital Proof of Participation Tokens',
  },
  description:
    'Create, distribute and manage digital proof of participation tokens that your community will love to collect and share.',
  keywords: [
    'POP',
    'proof of participation',
    'blockchain',
    'digital collectibles',
    'events',
    'tokens',
    'NFT',
    'community',
  ],
  authors: [{ name: 'POP' }],
  creator: 'POP',
  publisher: 'POP',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    title: 'POP | Create Digital Proof of Participation Tokens',
    description:
      'Create, distribute and manage digital proof of participation tokens that your community will love to collect and share.',
    siteName: 'POP',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`, 
        width: 1200,
        height: 630,
        alt: 'POP',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POP | Create Digital Proof of Participation Tokens',
    description:
      'Create memorable digital tokens for your events with our easy-to-use POP platform.',
    creator: '@popplatform',
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: 'index, follow',
  alternates: {
    canonical: BASE_URL,
  },
  other: {
    'og:logo': `${BASE_URL}/logo.png`,
  },
};

// Add a separate viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
              name: 'POP',
              url: 'https://popplatform.com',
              description: 'Create, distribute and manage digital proof of participation tokens.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://popplatform.com/search?q={search_term_string}',
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
              name: 'POP',
              url: 'https://popplatform.com',
              logo: 'https://popplatform.com/logo.png',
              sameAs: ['https://twitter.com/popplatform', 'https://discord.gg/popplatform'],
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
