import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken } from '@/lib/auth-utils';
import { transferTokenToWallet } from '@/lib/token-utils';

// Function to calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

interface Params {
  id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id: popId } = await params;
  
  try {
    // Verify user is authenticated
    const token = request.cookies.get('solana_auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const auth = await getAuthToken(token);
    
    if (!auth || !auth.walletAddress) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const walletAddress = auth.walletAddress;

    // Check if user already claimed this POP
    const existingClaim = await prisma.popClaim.findFirst({
      where: {
        popId,
        walletAddress,
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { 
          message: 'You have already claimed this POP',
          hasClaimed: true,
          claimTimestamp: existingClaim.createdAt,
          claimTxId: existingClaim.transactionSignature || undefined,
        },
        { status: 200 }
      );
    }

    // Find the location-based distribution method for this POP
    const distributionMethod = await prisma.distributionMethod.findFirst({
      where: {
        popId,
        type: 'LocationBased',
        disabled: false,
        deleted: false,
      },
      include: {
        locationBased: true
      }
    });

    if (!distributionMethod || !distributionMethod.locationBased) {
      return NextResponse.json(
        { message: 'No location-based claim method available for this POP' },
        { status: 404 }
      );
    }

    const locationData = distributionMethod.locationBased;

    // Fetch the token information for this POP
    const tokenInfo = await prisma.popToken.findFirst({
      where: { 
        popId: popId 
      },
      select: {
        mintAddress: true
      }
    });
    
    // Check if token is configured
    if (!tokenInfo || !tokenInfo.mintAddress) {
      return NextResponse.json(
        { message: 'POP token not configured' },
        { status: 400 }
      );
    }

    // Check if claim method has valid coordinates
    if (
      !locationData.latitude ||
      !locationData.longitude
    ) {
      return NextResponse.json(
        { message: 'Location coordinates not configured properly' },
        { status: 400 }
      );
    }

    // Check dates if specified
    const now = new Date();
    if (locationData.startDate && new Date(locationData.startDate) > now) {
      return NextResponse.json(
        { message: 'Location-based claim is not yet active' },
        { status: 400 }
      );
    }

    if (locationData.endDate && new Date(locationData.endDate) < now) {
      return NextResponse.json(
        { message: 'Location-based claim has expired' },
        { status: 400 }
      );
    }

    // Check max claims if specified
    if (
      locationData.maxClaims !== null &&
      locationData.claimCount >= locationData.maxClaims
    ) {
      return NextResponse.json(
        { message: 'Maximum number of claims reached' },
        { status: 400 }
      );
    }

    // Get user's location from the request body
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: 'Location data required' },
        { status: 400 }
      );
    }

    // Calculate distance
    const distance = calculateDistance(
      latitude,
      longitude,
      locationData.latitude,
      locationData.longitude
    );

    // Check if user is within the allowed radius
    if (distance > locationData.radius) {
      return NextResponse.json(
        { 
          message: `You are ${Math.round(distance)}m away from the claim area. You must be within ${locationData.radius}m to claim.`,
          inRange: false,
          distance: Math.round(distance)
        },
        { status: 400 }
      );
    }

    // Transfer token to the user's wallet
    const mintResult = await transferTokenToWallet(
      tokenInfo.mintAddress,
      walletAddress
    );

    if (!mintResult.success) {
      return NextResponse.json(
        { message: mintResult.message || 'Failed to mint token' },
        { status: 500 }
      );
    }

    // Generate a unique claim ID
    const claimId = `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Record the claim in the database
    try {
      await prisma.popClaim.create({
        data: {
          id: claimId,
          popId: popId,
          walletAddress: walletAddress,
          distributionMethodId: distributionMethod.id,
          transactionSignature: mintResult.signature,
        }
      });
    } catch (error) {
      console.error('Error recording claim:', error);
      // Even if recording fails, the token was transferred, so we consider it a success
    }

    // Update claim count
    try {
      await prisma.locationBased.update({
        where: {
          id: locationData.id
        },
        data: {
          claimCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error('Error updating claim count:', error);
      // Non-critical error, continue
    }

    return NextResponse.json({
      message: 'POP claimed successfully!',
      hasClaimed: true,
      claimId: claimId,
      claimTimestamp: new Date(),
      claimTxId: mintResult.signature
    });
  } catch (error) {
    console.error('Location claim error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
} 