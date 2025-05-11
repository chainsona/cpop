import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Params {
  id: string;
}

/**
 * API endpoint to get location-based distribution method details for a POAP
 */
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id: poapId } = await params;

    // Fetch the POAP location-based distribution method
    const distributionMethod = await prisma.distributionMethod.findFirst({
      where: {
        poapId,
        type: 'LocationBased',
        disabled: false,
        deleted: false,
      },
      include: {
        locationBased: true,
      },
    });

    if (!distributionMethod || !distributionMethod.locationBased) {
      return NextResponse.json(
        { error: 'Location-based distribution method not found' },
        { status: 404 }
      );
    }

    // Return the essential location details
    return NextResponse.json({
      id: distributionMethod.id,
      radius: distributionMethod.locationBased.radius,
      city: distributionMethod.locationBased.city,
      country: distributionMethod.locationBased.country,
      // Don't expose exact coordinates to the client
      hasCoordinates: Boolean(
        distributionMethod.locationBased.latitude && distributionMethod.locationBased.longitude
      ),
      maxClaims: distributionMethod.locationBased.maxClaims,
      claimCount: distributionMethod.locationBased.claimCount,
      startDate: distributionMethod.locationBased.startDate,
      endDate: distributionMethod.locationBased.endDate,
    });
  } catch (error) {
    console.error('Error fetching location-based distribution details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch location-based distribution details',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
