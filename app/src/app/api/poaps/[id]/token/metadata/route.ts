import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Visibility } from '@/generated/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerAuthSession();
    const { id } = await params;
    // Get the POAP with related data
    const poap = await prisma.poap.findUnique({
      where: { id },
      include: {
        tokens: true,
        settings: true,
      },
    });

    // Check if the POAP exists
    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Check if user is authorized (either the POAP is public or the user is the creator)
    const isPublic = poap.settings?.visibility === Visibility.Public;
    const isOwner = session?.user?.id && poap.creatorId === session.user.id;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Not authorized to view this POAP' }, { status: 403 });
    }

    // Check if the POAP has a token
    const token = poap.tokens && poap.tokens.length > 0 ? poap.tokens[0] : null;

    if (!token) {
      // Return a more friendly error - the token doesn't exist yet
      // Always use 200 status with fallback data when possible
      return NextResponse.json(
        {
          message: 'Token is being prepared. Displaying POAP information instead.',
          fallbackMetadata: {
            name: poap.title,
            description: poap.description,
            image: poap.imageUrl,
            attributes: [],
            properties: {},
            external_url: poap.website,
          },
        },
        { status: 200 }
      );
    }

    if (!token.mintAddress) {
      // Return a fallback response when the mint address isn't available
      return NextResponse.json(
        {
          message: 'Token is being prepared. Displaying POAP information instead.',
          fallbackMetadata: {
            name: poap.title,
            description: poap.description,
            image: poap.imageUrl,
            attributes: [],
            properties: {},
            external_url: poap.website,
          },
        },
        { status: 200 }
      );
    }

    // If we have a metadataUri, fetch the metadata
    if (token.metadataUri) {
      try {
        // Fetch the metadata from the URI
        const metadataResponse = await fetch(token.metadataUri, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!metadataResponse.ok) {
          // If we can't fetch from URI, return the basic metadata object gracefully
          return NextResponse.json({
            metadata: {
              name: poap.title,
              description: poap.description,
              image: poap.imageUrl,
              attributes: [],
              properties: {},
              external_url: poap.website,
            },
            message: 'Using fallback metadata while external metadata is being prepared',
          });
        }

        const metadata = await metadataResponse.json();

        return NextResponse.json({ metadata });
      } catch (error) {
        console.error('Error fetching metadata:', error);

        // If we can't fetch from URI, return a basic metadata object based on POAP data
        return NextResponse.json({
          metadata: {
            name: poap.title,
            description: poap.description,
            image: poap.imageUrl,
            attributes: [],
            properties: {},
            external_url: poap.website,
          },
          message: 'Using fallback metadata due to error fetching from URI',
        });
      }
    } else {
      // If there's no metadataUri, return a basic metadata object based on POAP data
      return NextResponse.json({
        metadata: {
          name: poap.title,
          description: poap.description,
          image: poap.imageUrl,
          attributes: [],
          properties: {},
          external_url: poap.website,
        },
        message: 'Using fallback metadata (no URI available)',
      });
    }
  } catch (error) {
    console.error('Error in metadata endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
