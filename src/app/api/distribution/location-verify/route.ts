import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

/**
 * Calculate distance between two points using the Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * API endpoint to verify a user's location for a location-based POP claim
 */
export async function POST(request: NextRequest) {
  try {
    // Use verifyAuth instead of getServerSession
    const auth = await verifyAuth(request);

    // Require authentication
    if (!auth.isAuthenticated || !auth.walletAddress) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'You must be authenticated to verify your location',
        },
        { status: 401 }
      );
    }

    const walletAddress = auth.walletAddress;

    // Parse request body
    const body = await request.json();
    const { distributionMethodId, userLatitude, userLongitude } = body;

    if (!distributionMethodId || userLatitude === undefined || userLongitude === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate coordinates
    if (
      typeof userLatitude !== 'number' ||
      typeof userLongitude !== 'number' ||
      userLatitude < -90 ||
      userLatitude > 90 ||
      userLongitude < -180 ||
      userLongitude > 180
    ) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Get distribution method and location data
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: distributionMethodId,
        type: 'LocationBased',
        disabled: false,
        deleted: false,
      },
      include: {
        locationBased: true,
        pop: true,
      },
    });

    if (!distributionMethod || !distributionMethod.locationBased) {
      return NextResponse.json(
        { error: 'Location-based distribution method not found' },
        { status: 404 }
      );
    }

    // Check if date is within valid range
    const now = new Date();
    if (
      (distributionMethod.locationBased.startDate &&
        now < new Date(distributionMethod.locationBased.startDate)) ||
      (distributionMethod.locationBased.endDate &&
        now > new Date(distributionMethod.locationBased.endDate))
    ) {
      return NextResponse.json(
        {
          valid: false,
          message: 'This claim is not currently available',
        },
        { status: 403 }
      );
    }

    // Check if max claims reached
    if (
      distributionMethod.locationBased.maxClaims &&
      distributionMethod.locationBased.claimCount >= distributionMethod.locationBased.maxClaims
    ) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Maximum number of claims reached',
        },
        { status: 403 }
      );
    }

    // Check if user already claimed this POP
    const existingClaim = await prisma.pOPClaim.findUnique({
      where: {
        popId_walletAddress: {
          popId: distributionMethod.popId,
          walletAddress,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        {
          valid: false,
          message: 'You have already claimed this POP',
        },
        { status: 403 }
      );
    }

    // Calculate distance between user and location
    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      distributionMethod.locationBased.latitude || 0,
      distributionMethod.locationBased.longitude || 0
    );

    // Check if user is within radius
    const isWithinRadius = distance <= distributionMethod.locationBased.radius;

    if (!isWithinRadius) {
      return NextResponse.json(
        {
          valid: false,
          message: 'You are not within the required location radius',
          distance: Math.round(distance),
          radius: distributionMethod.locationBased.radius,
        },
        { status: 403 }
      );
    }

    // User is within radius, return success
    return NextResponse.json({
      valid: true,
      message: 'Location verified successfully',
      pop: {
        id: distributionMethod.pop.id,
        title: distributionMethod.pop.title,
        distributionMethodId: distributionMethod.id,
      },
    });
  } catch (error) {
    console.error('Error verifying location:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify location',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
