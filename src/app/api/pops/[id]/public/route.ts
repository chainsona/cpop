import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type Params = Promise<{
  id: string;
}>;

// Get public POP details by ID without requiring authentication
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;

    // Fetch POP from database with minimal info for public viewing
    const pop = await prisma.pop.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        website: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        settings: {
          select: {
            visibility: true,
          },
        },
      },
    });

    if (!pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Only return POPs that are public
    if (pop.settings?.visibility !== 'Public') {
      return NextResponse.json({ error: 'This POP is not publicly accessible' }, { status: 403 });
    }

    return NextResponse.json({ pop });
  } catch (error) {
    console.error('Error fetching public POP details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch POP details',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
