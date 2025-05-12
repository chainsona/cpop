import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// Use string literal type instead of importing from Prisma
type DistributionType = 'ClaimLinks' | 'SecretWord' | 'LocationBased' | 'Airdrop';

interface Params {
  id: string;
}

/**
 * API endpoint to claim a POP using a specific distribution method
 */
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    // Use verifyAuth instead of getServerSession
    const auth = await verifyAuth(request);

    // Require authentication
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
    const { id: popId } = await params;

    // Parse request body
    const body = await request.json();
    const { distributionMethodId, method } = body;

    if (!distributionMethodId || !method) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Validate distribution method exists and is active
    const distributionMethod = await prisma.distributionMethod.findUnique({
      where: {
        id: distributionMethodId,
        popId,
        type: method as DistributionType,
        disabled: false,
        deleted: false,
      },
      include: {
        locationBased: method === 'LocationBased' ? true : undefined,
        secretWord: method === 'SecretWord' ? true : undefined,
        airdrop: method === 'Airdrop' ? true : undefined,
        pop: true,
      },
    });

    if (!distributionMethod) {
      return NextResponse.json(
        { error: 'Distribution method not found or inactive' },
        { status: 404 }
      );
    }

    // Check if POP exists and is claimable
    if (!distributionMethod.pop) {
      return NextResponse.json({ error: 'POP not found' }, { status: 404 });
    }

    // Check if user already claimed this POP
    const existingClaim = await prisma.pOPClaim.findUnique({
      where: {
        popId_walletAddress: {
          popId,
          walletAddress,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json({ error: 'You have already claimed this POP' }, { status: 403 });
    }

    // Process claim based on distribution method type
    switch (method) {
      case 'LocationBased': {
        if (!distributionMethod.locationBased) {
          return NextResponse.json(
            { error: 'Location-based distribution method not properly configured' },
            { status: 400 }
          );
        }

        // Check if max claims reached
        if (
          distributionMethod.locationBased.maxClaims &&
          distributionMethod.locationBased.claimCount >= distributionMethod.locationBased.maxClaims
        ) {
          return NextResponse.json({ error: 'Maximum number of claims reached' }, { status: 403 });
        }

        // Increment claim count
        await prisma.locationBased.update({
          where: { id: distributionMethod.locationBased.id },
          data: { claimCount: { increment: 1 } },
        });
        break;
      }

      case 'SecretWord':
        // Secret word claim handling would go here
        break;

      case 'Airdrop':
        // Airdrop claim handling would go here
        break;

      case 'ClaimLinks':
        // Claim links handling would go here
        break;

      default:
        return NextResponse.json({ error: 'Invalid distribution method type' }, { status: 400 });
    }

    // Create the claim record
    const claim = await prisma.pOPClaim.create({
      data: {
        popId,
        walletAddress,
        distributionMethodId,
      },
    });

    // Return success response
    return NextResponse.json({
      message: 'POP claimed successfully',
      claim: {
        id: claim.id,
        createdAt: claim.createdAt,
      },
    });
  } catch (error) {
    console.error('Error claiming POP:', error);
    return NextResponse.json(
      {
        error: 'Failed to claim POP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
