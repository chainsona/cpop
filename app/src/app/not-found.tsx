import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { generateViewport } from '@/lib/utils/metadata';

export const metadata: Metadata = {
  title: 'Page Not Found | POAP',
  description: 'The requested page could not be found',
  openGraph: {
    title: 'Page Not Found',
    description: 'The requested page could not be found',
    type: 'website',
    locale: 'en-US',
    siteName: 'POAP',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Page Not Found',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Not Found',
    description: 'The requested page could not be found',
    images: ['/og-image.jpg'],
    creator: '@poapplatform',
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'og:logo': '/logo.png',
  },
};

export const viewport: Viewport = generateViewport();

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-neutral-600 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
