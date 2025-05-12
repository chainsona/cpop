import { Metadata } from 'next';
import { generateMetadata as baseGenerateMetadata } from '@/lib/utils/metadata';
import { prisma } from '@/lib/db';

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  try {
    // Fetch the POAP from the database to get its details
    const poap = await prisma.poap.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        website: true,
      },
    });

    if (!poap) {
      // Fallback metadata for when the POAP isn't found
      return baseGenerateMetadata(
        'POAP Not Found',
        'The requested POAP could not be found.'
      );
    }

    // Base URL from environment or fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ngrok.maikers.com';
    
    // Generate the canonical URL for this POAP
    const canonicalUrl = `${baseUrl}/poaps/${poap.id}`;
    
    // Ensure image URL is absolute
    const imageUrl = poap.imageUrl.startsWith('http') 
      ? poap.imageUrl 
      : `${baseUrl}${poap.imageUrl}`;
    
    // Logo URL - use the app logo
    const logoUrl = `${baseUrl}/logo.png`;

    // Return the metadata with POAP-specific information
    return {
      title: `${poap.title} | POAP`,
      description: poap.description || 'A digital proof of attendance token.',
      metadataBase: new URL(baseUrl),
      openGraph: {
        title: poap.title,
        description: poap.description || 'A digital proof of attendance token.',
        type: 'article',
        url: canonicalUrl,
        locale: 'en-US',
        siteName: 'POAP',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: poap.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: poap.title,
        description: poap.description || 'A digital proof of attendance token.',
        images: [imageUrl],
        creator: '@poapplatform',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      other: {
        'og:logo': logoUrl,
      },
    };
  } catch (error) {
    console.error('Error generating POAP metadata:', error);
    
    // Fallback metadata in case of error
    return baseGenerateMetadata(
      'POAP Details',
      'View details for this digital proof of attendance token.'
    );
  }
} 