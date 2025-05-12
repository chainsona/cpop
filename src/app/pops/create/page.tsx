import { Metadata, Viewport } from 'next';
import { CreatePOP } from '@/components/CreatePOP';
import { CreateExamplePOP } from '@/components/pop/create-example-pop';
import { generateViewport } from '@/lib/utils/metadata';

export const generateMetadata = (): Metadata => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cpop.maikers.com';
  const title = 'Create POP';
  const description = 'Create a new Proof of Participation token';
  
  return {
    title: `${title} | POP`,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/pops/create`,
      locale: 'en-US',
      siteName: 'POP',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`],
      creator: '@popplatform',
    },
    alternates: {
      canonical: `${baseUrl}/pops/create`,
    },
    other: {
      'og:logo': `${baseUrl}/logo.png`,
    },
  };
};

export const viewport: Viewport = generateViewport();

export default function CreatePOPPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create POP</h1>
          <CreateExamplePOP />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <CreatePOP />
        </div>
      </div>
    </div>
  );
}
