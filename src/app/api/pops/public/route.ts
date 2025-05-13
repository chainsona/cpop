import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Visibility, PopStatus } from '@/generated/prisma';

// GET handler to fetch public POPs
export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from query
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Create optimized where clause
    const whereClause = {
      AND: [
        {
          status: {
            not: PopStatus.Deleted, // Filter out deleted POPs
          },
        },
        {
          OR: [
            {
              settings: {
                is: {
                  visibility: Visibility.Public,
                },
              },
            },
            {
              settings: null, // Include POPs with no settings (default to public)
            },
            {
              status: PopStatus.Published,
            },
          ],
        },
      ],
    };

    // Efficient parallel queries using Promise.all
    const [totalCount, pops] = await Promise.all([
      // Count query with the same filter
      prisma.pop.count({ where: whereClause }),
      
      // Data query with pagination and optimized includes
      prisma.pop.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          settings: {
            select: {
              visibility: true,
              allowSearch: true,
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
            },
          },
        },
        skip,
        take: limit,
      }),
    ]);

    // Return paginated results with metadata
    return NextResponse.json({
      pops,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching public POPs:', error);
    return NextResponse.json({ error: 'Failed to fetch public POPs' }, { status: 500 });
  }
}
