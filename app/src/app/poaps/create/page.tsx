import { Metadata, Viewport } from 'next';
import { CreatePOAP } from '@/components/CreatePOAP';
import { CreateExamplePOAP } from '@/components/poap/create-example-poap';
import { generateViewport } from '@/lib/utils/metadata';

export const generateMetadata = (): Metadata => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ngrok.maikers.com';
  const title = 'Create POAP';
  const description = 'Create a new Proof of Attendance Protocol token';
  
  return {
    title: `${title} | POAP`,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/poaps/create`,
      locale: 'en-US',
      siteName: 'POAP',
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
      creator: '@poapplatform',
    },
    alternates: {
      canonical: `${baseUrl}/poaps/create`,
    },
    other: {
      'og:logo': `${baseUrl}/logo.png`,
    },
  };
};

export const viewport: Viewport = generateViewport();

export default function CreatePOAPPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create POAP</h1>
          <CreateExamplePOAP />
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <CreatePOAP />
        </div>
      </div>
    </div>
  );
}
