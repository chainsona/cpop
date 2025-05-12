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
    // Get the POP with related data
    const pop = await prisma.pop.findUnique({
      where: { id },
      include: {
        tokens: true,
        settings: true,
      },
    });

    // Check if the POP exists
    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check if user is authorized (either the POP is public or the user is the creator)
    const isPublic = pop.settings?.visibility === Visibility.Public;
    const isOwner = session?.user?.id && pop.creatorId === session.user.id;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: 'Not authorized to view this POP' }, { status: 403 });
    }

    // Check if the POP has a token
    const token = pop.tokens && pop.tokens.length > 0 ? pop.tokens[0] : null;

    if (!token) {
      // Return a more friendly error - the token doesn't exist yet
      // Always use 200 status with fallback data when possible
      return NextResponse.json(
        {
          message: 'Token is being prepared. Displaying POP information instead.',
          fallbackMetadata: {
            name: pop.title,
            description: pop.description,
            image: pop.imageUrl,
            attributes: [],
            properties: {},
            external_url: pop.website,
          },
        },
        { status: 200 }
      );
    }

    if (!token.mintAddress) {
      // Return a fallback response when the mint address isn't available
      return NextResponse.json(
        {
          message: 'Token is being prepared. Displaying POP information instead.',
          fallbackMetadata: {
            name: pop.title,
            description: pop.description,
            image: pop.imageUrl,
            attributes: [],
            properties: {},
            external_url: pop.website,
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
              name: pop.title,
              description: pop.description,
              image: pop.imageUrl,
              attributes: [],
              properties: {},
              external_url: pop.website,
            },
            message: 'Using fallback metadata while external metadata is being prepared',
          });
        }

        const metadata = await metadataResponse.json();

        return NextResponse.json({ metadata });
      } catch (error) {
        console.error('Error fetching metadata:', error);

        // If we can't fetch from URI, return a basic metadata object based on POP data
        return NextResponse.json({
          metadata: {
            name: pop.title,
            description: pop.description,
            image: pop.imageUrl,
            attributes: [],
            properties: {},
            external_url: pop.website,
          },
          message: 'Using fallback metadata due to error fetching from URI',
        });
      }
    } else {
      // If there's no metadataUri, return a basic metadata object based on POP data
      return NextResponse.json({
        metadata: {
          name: pop.title,
          description: pop.description,
          image: pop.imageUrl,
          attributes: [],
          properties: {},
          external_url: pop.website,
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
