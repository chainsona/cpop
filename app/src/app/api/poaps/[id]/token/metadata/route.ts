import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Visibility } from '@/generated/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerAuthSession();
    
    // Get the POAP with related data
    const poap = await prisma.poap.findUnique({
      where: { id: params.id },
      include: {
        tokens: true,
        settings: true,
      },
    });

    // Check if the POAP exists
    if (!poap) {
      return NextResponse.json(
        { error: 'POAP not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized (either the POAP is public or the user is the creator)
    const isPublic = poap.settings?.visibility === Visibility.Public;
    const isOwner = 
      session?.user?.id && 
      poap.creatorId === session.user.id;

    if (!isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'Not authorized to view this POAP' },
        { status: 403 }
      );
    }

    // Check if the POAP has a token
    const token = poap.tokens && poap.tokens.length > 0 ? poap.tokens[0] : null;

    if (!token || !token.mintAddress) {
      return NextResponse.json(
        { error: 'No token associated with this POAP' },
        { status: 404 }
      );
    }

    // If we have a metadataUri, fetch the metadata
    if (token.metadataUri) {
      try {
        // Fetch the metadata from the URI
        const metadataResponse = await fetch(token.metadataUri);
        
        if (!metadataResponse.ok) {
          throw new Error('Failed to fetch metadata from URI');
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
          }
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
        }
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 