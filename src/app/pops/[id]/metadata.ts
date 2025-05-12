import { Metadata } from 'next';
import { generateMetadata as baseGenerateMetadata } from '@/lib/utils/metadata';
import { prisma } from '@/lib/db';

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  try {
    // Fetch the POP from the database to get its details
    const pop = await prisma.pop.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        website: true,
      },
    });

    if (!pop) {
      // Fallback metadata for when the POP isn't found
      return baseGenerateMetadata(
        'POP Not Found',
        'The requested POP could not be found.'
      );
    }

    // Base URL from environment or fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cpop.maikers.com';
    
    // Generate the canonical URL for this POP
    const canonicalUrl = `${baseUrl}/pops/${pop.id}`;
    
    // Ensure image URL is absolute
    const imageUrl = pop.imageUrl.startsWith('http') 
      ? pop.imageUrl 
      : `${baseUrl}${pop.imageUrl}`;
    
    // Logo URL - use the app logo
    const logoUrl = `${baseUrl}/logo.png`;

    // Return the metadata with POP-specific information
    return {
      title: `${pop.title} | POP`,
      description: pop.description || 'A digital proof of attendance token.',
      metadataBase: new URL(baseUrl),
      openGraph: {
        title: pop.title,
        description: pop.description || 'A digital proof of attendance token.',
        type: 'article',
        url: canonicalUrl,
        locale: 'en-US',
        siteName: 'POP',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: pop.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: pop.title,
        description: pop.description || 'A digital proof of attendance token.',
        images: [imageUrl],
        creator: '@popplatform',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      other: {
        'og:logo': logoUrl,
      },
    };
  } catch (error) {
    console.error('Error generating POP metadata:', error);
    
    // Fallback metadata in case of error
    return baseGenerateMetadata(
      'POP Details',
      'View details for this digital proof of attendance token.'
    );
  }
} 