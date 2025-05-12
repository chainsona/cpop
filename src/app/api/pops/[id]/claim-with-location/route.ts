import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { transferTokenToWallet } from '@/lib/token-utils';

// Function to calculate distance between two points using the Haversine formula
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

interface Params {
  id: string;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * API endpoint to verify location and claim a POP in a single step
 */
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    // Get popId from params
    const { id: popId } = await params;
    
    // Debugging: Log auth headers
    const authHeader = request.headers.get('authorization');
    const cookie = request.headers.get('cookie');
    
    console.log('CLAIM API DEBUG:', {
      popId,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + '...' : null,
      hasCookie: !!cookie,
      cookieContainsAuth: cookie?.includes('solana_auth_token'),
    });

    // Authenticate the request - check both auth header and cookies
    const auth = await verifyAuth(request);

    // Log auth result
    console.log('Auth verification result:', { 
      isAuthenticated: auth.isAuthenticated,
      hasWalletAddress: !!auth.walletAddress,
      walletAddressPrefix: auth.walletAddress ? auth.walletAddress.substring(0, 6) + '...' : null
    });

    if (!auth.isAuthenticated || !auth.walletAddress) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'You must be authenticated to claim this POP',
        },
        { status: 401 }
      );
    }

    const walletAddress = auth.walletAddress;

    // Parse request body
    const body = await request.json();
    const { distributionMethodId, userLatitude, userLongitude, method } = body;

    if (
      !distributionMethodId ||
      !method ||
      userLatitude === undefined ||
      userLongitude === undefined
    ) {
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
      return NextResponse.json(
        {
          error: 'LOCATION_VERIFICATION_FAILED',
          message: 'Invalid coordinates',
        },
        { status: 400 }
      );
    }

    // Validate that method is LocationBased
    if (method !== 'LocationBased') {
      return NextResponse.json(
        { error: 'This endpoint only supports LocationBased claims' },
        { status: 400 }
      );
    }

    // Get distribution method details
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: distributionMethodId,
        popId,
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
        {
          error: 'LOCATION_VERIFICATION_FAILED',
          message: 'Location-based distribution method not found',
        },
        { status: 404 }
      );
    }

    // Check if POP exists and is claimable
    if (!distributionMethod.pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
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
          error: 'LOCATION_VERIFICATION_FAILED',
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
          error: 'LOCATION_VERIFICATION_FAILED',
          message: 'Maximum number of claims reached',
        },
        { status: 403 }
      );
    }

    // Check if user already claimed this POP
    const existingClaim = await prisma.popClaim.findUnique({
      where: {
        popId_walletAddress: {
          popId,
          walletAddress,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        {
          error: 'LOCATION_VERIFICATION_FAILED',
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
          error: 'LOCATION_VERIFICATION_FAILED',
          message: 'You are not within the required location radius',
          distance: Math.round(distance),
          radius: distributionMethod.locationBased.radius,
        },
        { status: 403 }
      );
    }

    // Location verified successfully, proceed with claim

    // Fetch the token information for this POP
    const tokenInfo = await prisma.popToken.findFirst({
      where: {
        popId: popId,
      },
      select: {
        mintAddress: true,
      },
    });

    // Check if token is configured
    if (!tokenInfo || !tokenInfo.mintAddress) {
      return NextResponse.json({ error: 'POP token not configured' }, { status: 400 });
    }

    // Transfer token to the user's wallet
    const mintResult = await transferTokenToWallet(tokenInfo.mintAddress, walletAddress);

    if (!mintResult.success) {
      return NextResponse.json(
        { error: mintResult.message || 'Failed to mint token' },
        { status: 500 }
      );
    }

    // Increment claim count
    await prisma.locationBased.update({
      where: { id: distributionMethod.locationBased.id },
      data: { claimCount: { increment: 1 } },
    });

    // Create the claim record with transaction signature
    const claim = await prisma.popClaim.create({
      data: {
        popId,
        walletAddress,
        distributionMethodId,
        transactionSignature: mintResult.signature,
      },
    });

    // Return success response
    return NextResponse.json({
      message: 'POP claimed successfully',
      claim: {
        id: claim.id,
        createdAt: claim.createdAt,
        transactionSignature: mintResult.signature,
      },
    });
  } catch (error) {
    console.error('Error claiming POP with location verification:', error);
    return NextResponse.json(
      {
        error: 'Failed to claim POP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
