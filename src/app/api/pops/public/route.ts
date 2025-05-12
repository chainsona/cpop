import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET handler to fetch public POPs
export async function GET(request: NextRequest) {
  try {
    // First check if any POPs exist at all
    const totalPops = await prisma.pop.count();
    console.log(`Total POPs in database: ${totalPops}`);

    // Check POPs with explicit public visibility
    const publicPops = await prisma.pop.count({
      where: {
        settings: {
          is: {
            visibility: 'Public',
          },
        },
      },
    });
    console.log(`POPs with public visibility: ${publicPops}`);

    // Check published POPs
    const publishedPops = await prisma.pop.count({
      where: {
        status: 'Published',
      },
    });
    console.log(`Published POPs: ${publishedPops}`);

    // Check POPs with no settings
    const noSettingsPops = await prisma.pop.count({
      where: {
        settings: null,
      },
    });
    console.log(`POPs with no settings: ${noSettingsPops}`);

    // For development, get all POPs to debug
    const allPopIds = await prisma.pop.findMany({
      select: { id: true, status: true },
      take: 10,
    });
    console.log('Sample POPs:', allPopIds);

    // Fetch POPs with relaxed criteria to debug
    const pops = await prisma.pop.findMany({
      where: {
        OR: [
          {
            settings: {
              is: {
                visibility: 'Public',
              },
            },
          },
          {
            settings: null, // Include POPs with no settings (default to public)
          },
          // Temporarily include all published POPs for debugging
          {
            status: 'Published',
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        settings: true,
        creator: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
      },
    });

    console.log(`Found ${pops.length} POPs with relaxed criteria`);
    if (pops.length > 0) {
      console.log('First POP:', {
        id: pops[0].id,
        title: pops[0].title,
        status: pops[0].status,
        visibility: pops[0].settings?.visibility || 'No settings',
      });
    }

    return NextResponse.json({ pops });
  } catch (error) {
    console.error('Error fetching public POPs:', error);
    return NextResponse.json({ error: 'Failed to fetch public POPs' }, { status: 500 });
  }
}
