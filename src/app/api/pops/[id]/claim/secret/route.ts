import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { generateClaimId } from '@/lib/claims';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'your-internal-api-key';

interface Params {
  id: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  // Get the POP ID from the route params
  const { id: popId } = await params;

  try {
    // Verify user is authenticated
    const authResult = await verifyAuth(request);

    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { message: 'Authentication required to claim POP' },
        { status: 401 }
      );
    }

    // Get wallet address from authenticated user
    const walletAddress = authResult.walletAddress;

    if (!walletAddress) {
      return NextResponse.json(
        { message: 'Wallet address not found in authentication token' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { secretWord } = body;

    if (!secretWord) {
      return NextResponse.json({ message: 'Secret word is required' }, { status: 400 });
    }

    console.log(
      `Processing claim for POP ${popId} with wallet ${walletAddress.substring(0, 8)}...`
    );

    // Get the POP details from the database to check validity
    try {
      const popResponse = await fetch(`${INTERNAL_API_URL}/pops/${popId}`, {
        headers: {
          Authorization: `Internal ${INTERNAL_API_KEY}`,
        },
      });

      if (!popResponse.ok) {
        const errorText = await popResponse.text();
        console.error(`POP fetch error: Status ${popResponse.status}, Response: ${errorText}`);

        if (popResponse.status === 404) {
          return NextResponse.json({ message: 'POP not found' }, { status: 404 });
        }

        return NextResponse.json(
          { message: `Failed to verify POP details: ${popResponse.status}` },
          { status: 500 }
        );
      }

      const popData = await popResponse.json();

      // Check if POP is valid for claiming
      if (popData.pop.status !== 'Published' && popData.pop.status !== 'Distributed') {
        return NextResponse.json(
          { message: `This POP is not available for claiming (status: ${popData.pop.status})` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error fetching POP details:', error);
      return NextResponse.json(
        { message: 'Failed to verify POP details due to internal error' },
        { status: 500 }
      );
    }

    // Get secret word distribution method from the database
    try {
      const distributionResponse = await fetch(
        `${INTERNAL_API_URL}/pops/${popId}/distribution/secret`,
        {
          headers: {
            Authorization: `Internal ${INTERNAL_API_KEY}`,
          },
        }
      );

      if (!distributionResponse.ok) {
        const errorText = await distributionResponse.text();
        console.error(
          `Distribution method fetch error: Status ${distributionResponse.status}, Response: ${errorText}`
        );

        if (distributionResponse.status === 404) {
          return NextResponse.json(
            { message: 'Secret word claim method not available for this POP' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { message: `Failed to verify claim method: ${distributionResponse.status}` },
          { status: 500 }
        );
      }

      const distributionData = await distributionResponse.json();

      // Check if the method is disabled
      if (distributionData.disabled) {
        return NextResponse.json(
          { message: 'Secret word claim method is currently disabled' },
          { status: 400 }
        );
      }

      // Verify the secret word matches
      if (distributionData.secretWord !== secretWord) {
        return NextResponse.json({ message: 'Invalid secret word' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error fetching distribution method:', error);
      return NextResponse.json(
        { message: 'Failed to verify claim method due to internal error' },
        { status: 500 }
      );
    }

    // Check if user has already claimed this POP
    try {
      const claimStatusResponse = await fetch(
        `${INTERNAL_API_URL}/pops/${popId}/claims/check?walletAddress=${walletAddress}`,
        {
          headers: {
            Authorization: `Internal ${INTERNAL_API_KEY}`,
          },
        }
      );

      if (claimStatusResponse.ok) {
        const claimStatus = await claimStatusResponse.json();

        if (claimStatus.hasClaimed) {
          return NextResponse.json(
            {
              message: 'You have already claimed this POP',
              claimId: claimStatus.claimId,
            },
            { status: 400 }
          );
        }
      } else if (claimStatusResponse.status !== 404) {
        // Only log as an error if it's not a 404 (which just means "not claimed yet")
        const errorText = await claimStatusResponse.text();
        console.error(
          `Claim status check error: Status ${claimStatusResponse.status}, Response: ${errorText}`
        );
      }
    } catch (error) {
      console.error('Error checking claim status:', error);
      // Continue with the claim attempt even if status check fails
    }

    // All checks passed - process the claim
    const claimId = generateClaimId();

    // Submit claim to the backend/database
    try {
      const claimResponse = await fetch(`${INTERNAL_API_URL}/pops/${popId}/claims`, {
        method: 'POST',
        headers: {
          Authorization: `Internal ${INTERNAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId,
          walletAddress,
          method: 'secret',
          metadata: {
            secretWord: secretWord,
          },
        }),
      });

      if (!claimResponse.ok) {
        const errorText = await claimResponse.text();
        console.error(
          `Claim processing error: Status ${claimResponse.status}, Response: ${errorText}`
        );
        return NextResponse.json(
          { message: `Failed to process claim: ${claimResponse.status}` },
          { status: 500 }
        );
      }

      const claimData = await claimResponse.json();
      console.log(`POP ${popId} successfully claimed with ID ${claimData.claimId}`);

      // Return successful response with claim ID
      return NextResponse.json({
        message: 'POP claimed successfully',
        claimId: claimData.claimId,
        status: 'success',
      });
    } catch (error) {
      console.error('Error processing claim:', error);
      return NextResponse.json(
        { message: 'Failed to process claim due to internal error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in secret word claim:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add HEAD/OPTIONS methods for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
