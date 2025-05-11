import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { generateClaimId } from '@/lib/claims';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'your-internal-api-key';

interface Params {
  id: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  // Get the POAP ID from the route params
  const { id: poapId } = await params;

  try {
    // Verify user is authenticated
    const authResult = await verifyAuth(request);

    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { message: 'Authentication required to claim POAP' },
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
      `Processing claim for POAP ${poapId} with wallet ${walletAddress.substring(0, 8)}...`
    );

    // Get the POAP details from the database to check validity
    try {
      const poapResponse = await fetch(`${INTERNAL_API_URL}/poaps/${poapId}`, {
        headers: {
          Authorization: `Internal ${INTERNAL_API_KEY}`,
        },
      });

      if (!poapResponse.ok) {
        const errorText = await poapResponse.text();
        console.error(`POAP fetch error: Status ${poapResponse.status}, Response: ${errorText}`);

        if (poapResponse.status === 404) {
          return NextResponse.json({ message: 'POAP not found' }, { status: 404 });
        }

        return NextResponse.json(
          { message: `Failed to verify POAP details: ${poapResponse.status}` },
          { status: 500 }
        );
      }

      const poapData = await poapResponse.json();

      // Check if POAP is valid for claiming
      if (poapData.poap.status !== 'Published' && poapData.poap.status !== 'Distributed') {
        return NextResponse.json(
          { message: `This POAP is not available for claiming (status: ${poapData.poap.status})` },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error fetching POAP details:', error);
      return NextResponse.json(
        { message: 'Failed to verify POAP details due to internal error' },
        { status: 500 }
      );
    }

    // Get secret word distribution method from the database
    try {
      const distributionResponse = await fetch(
        `${INTERNAL_API_URL}/poaps/${poapId}/distribution/secret`,
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
            { message: 'Secret word claim method not available for this POAP' },
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

    // Check if user has already claimed this POAP
    try {
      const claimStatusResponse = await fetch(
        `${INTERNAL_API_URL}/poaps/${poapId}/claims/check?walletAddress=${walletAddress}`,
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
              message: 'You have already claimed this POAP',
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
      const claimResponse = await fetch(`${INTERNAL_API_URL}/poaps/${poapId}/claims`, {
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
      console.log(`POAP ${poapId} successfully claimed with ID ${claimData.claimId}`);

      // Return successful response with claim ID
      return NextResponse.json({
        message: 'POAP claimed successfully',
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
