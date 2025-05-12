import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET handler to fetch public POAPs
export async function GET(request: NextRequest) {
  try {
    // First check if any POAPs exist at all
    const totalPoaps = await prisma.poap.count();
    console.log(`Total POAPs in database: ${totalPoaps}`);

    // Check POAPs with explicit public visibility
    const publicPoaps = await prisma.poap.count({
      where: {
        settings: {
          is: {
            visibility: 'Public',
          },
        },
      },
    });
    console.log(`POAPs with public visibility: ${publicPoaps}`);

    // Check published POAPs
    const publishedPoaps = await prisma.poap.count({
      where: {
        status: 'Published',
      },
    });
    console.log(`Published POAPs: ${publishedPoaps}`);

    // Check POAPs with no settings
    const noSettingsPoaps = await prisma.poap.count({
      where: {
        settings: null,
      },
    });
    console.log(`POAPs with no settings: ${noSettingsPoaps}`);

    // For development, get all POAPs to debug
    const allPoapIds = await prisma.poap.findMany({
      select: { id: true, status: true },
      take: 10,
    });
    console.log('Sample POAPs:', allPoapIds);

    // Fetch POAPs with relaxed criteria to debug
    const poaps = await prisma.poap.findMany({
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
            settings: null, // Include POAPs with no settings (default to public)
          },
          // Temporarily include all published POAPs for debugging
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

    console.log(`Found ${poaps.length} POAPs with relaxed criteria`);
    if (poaps.length > 0) {
      console.log('First POAP:', {
        id: poaps[0].id,
        title: poaps[0].title,
        status: poaps[0].status,
        visibility: poaps[0].settings?.visibility || 'No settings',
      });
    }

    return NextResponse.json({ poaps });
  } catch (error) {
    console.error('Error fetching public POAPs:', error);
    return NextResponse.json({ error: 'Failed to fetch public POAPs' }, { status: 500 });
  }
}
