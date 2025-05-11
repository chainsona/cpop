import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Params {
  id: string;
}

// Get public POAP attributes by ID without requiring authentication
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // First check if the POAP exists and is public
    const poap = await prisma.poap.findUnique({
      where: { id },
      select: {
        id: true,
        settings: {
          select: {
            visibility: true,
          },
        },
      },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Only return attributes for POAPs that are public
    if (poap.settings?.visibility !== 'Public') {
      return NextResponse.json({ error: 'This POAP is not publicly accessible' }, { status: 403 });
    }

    // Fetch only the public attributes
    const attributes = await prisma.attributes.findUnique({
      where: { poapId: id },
      select: {
        eventType: true,
        city: true,
        country: true,
        platform: true,
        artists: {
          select: {
            name: true,
            url: true,
          },
        },
        organization: {
          select: {
            name: true,
            url: true,
          },
        },
      },
    });

    if (!attributes) {
      return NextResponse.json({ attributes: null });
    }

    return NextResponse.json({ attributes });
  } catch (error) {
    console.error('Error fetching public POAP attributes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch POAP attributes',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
