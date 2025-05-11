import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken } from '@/lib/auth-utils';
import { transferTokenToWallet } from '@/lib/token-utils';
import { mintTokensAfterDistributionCreated } from '@/lib/poap-utils';

// This is a simplified example of token minting
// In a real implementation, you would integrate with a blockchain library/service
async function mintToken(
  mintAddress: string,
  recipientWallet: string
): Promise<{ success: boolean; signature?: string; message?: string }> {
  try {
    // In a real implementation, this would call a blockchain service to mint the token
    console.log(`Minting token ${mintAddress} to wallet ${recipientWallet}`);

    // Simulate a successful mint operation
    return {
      success: true,
      signature: `sim-tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
  } catch (error) {
    console.error('Error minting token:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown minting error',
    };
  }
}

// Check if POAP token exists and create it if not
async function ensurePoapTokenExists(poapId: string): Promise<{ success: boolean; mintAddress?: string; message?: string }> {
  try {
    // Check if token already exists
    const existingToken = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    if (existingToken && existingToken.mintAddress) {
      console.log(`POAP token already exists for POAP ${poapId}`);
      return {
        success: true,
        mintAddress: existingToken.mintAddress,
      };
    }

    // Token doesn't exist, create it
    console.log(`POAP token does not exist for POAP ${poapId}, creating now...`);
    const mintResult = await mintTokensAfterDistributionCreated(poapId);
    
    if (!mintResult || !mintResult.success) {
      const errorMessage = mintResult?.message || 'Failed to create POAP token';
      console.error(`Error creating POAP token: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
      };
    }

    return {
      success: true,
      mintAddress: mintResult.mintAddress,
    };
  } catch (error) {
    console.error('Error ensuring POAP token exists:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error checking/creating POAP token',
    };
  }
}

// Extract wallet address from auth token
async function getWalletFromAuth(request: NextRequest): Promise<string | null> {
  // In a real implementation, you would verify the auth token
  // and extract the user's wallet address

  // For demo purposes, we'll return a simulated wallet address
  const authCookie = request.cookies.get('solana_auth_token');
  if (!authCookie) {
    return null;
  }

  return 'demo-wallet-' + authCookie.value.substring(0, 8);
}

// Check if user has already claimed this POAP
async function hasUserClaimedPOAP(poapId: string, walletAddress: string): Promise<boolean> {
  try {
    const existingClaim = await prisma.pOAPClaim.findFirst({
      where: {
        poapId: poapId,
        walletAddress: walletAddress,
      },
    });

    return !!existingClaim;
  } catch (error) {
    console.error('Error checking existing claims:', error);
    // In case of error, assume user hasn't claimed to avoid blocking legitimate users
    return false;
  }
}

// Record a claim with protection against duplicates
async function recordClaim(
  poapId: string,
  walletAddress: string,
  distributionMethodId: string,
  txSignature: string
): Promise<{ success: boolean; claimId?: string; message?: string }> {
  try {
    // First check if claim already exists (double protection)
    const hasClaimed = await hasUserClaimedPOAP(poapId, walletAddress);
    if (hasClaimed) {
      return {
        success: false,
        message: 'You have already claimed this POAP',
      };
    }

    // Generate a unique claim ID
    const claimId = `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // First try with "Claim" table
      await prisma.$executeRaw`
        INSERT INTO "Claim" ("id", "poapId", "walletAddress", "distributionMethodId", "transactionSignature", "createdAt", "updatedAt")
        VALUES (
          ${claimId}, 
          ${poapId}, 
          ${walletAddress}, 
          ${distributionMethodId}, 
          ${txSignature}, 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `;
    } catch (error) {
      console.log('First insert attempt failed, trying alternative table:', error);
      // If the first table insert fails, try with "POAPClaim"
      await prisma.$executeRaw`
        INSERT INTO "POAPClaim" ("id", "poapId", "walletAddress", "distributionMethodId", "transactionSignature", "createdAt", "updatedAt")
        VALUES (
          ${claimId}, 
          ${poapId}, 
          ${walletAddress}, 
          ${distributionMethodId}, 
          ${txSignature}, 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `;
    }

    return {
      success: true,
      claimId,
    };
  } catch (error) {
    console.error('Error recording claim:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to record claim',
    };
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: poapId } = await params;

  try {
    // Verify user is authenticated
    const token = request.cookies.get('solana_auth_token')?.value;

    if (!token) {
      console.log('Authentication failed: No token found in cookies');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Log token info for debugging
    try {
      const decodedToken = Buffer.from(token, 'base64').toString();
      const tokenData = JSON.parse(decodedToken);
      console.log('Token content:', {
        messageKeys: tokenData.message ? Object.keys(tokenData.message) : 'no message',
        hasAddress: tokenData.message?.address ? 'yes' : 'no',
        hasWallet: tokenData.message?.wallet ? 'yes' : 'no',
        expiryTime: tokenData.message?.expirationTime || 'none',
      });
    } catch (e) {
      console.error('Error decoding token:', e);
    }

    const auth = await getAuthToken(token);

    if (!auth || !auth.walletAddress) {
      console.log('Authentication failed: getAuthToken returned null or no wallet address', auth);
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const walletAddress = auth.walletAddress;

    // Check if user has already claimed this POAP (API-level protection)
    const alreadyClaimed = await hasUserClaimedPOAP(poapId, walletAddress);
    if (alreadyClaimed) {
      return NextResponse.json(
        {
          message: 'You have already claimed this POAP',
          hasClaimed: true,
        },
        { status: 409 } // Conflict status code
      );
    }

    // Get the secret word from the request body
    const { secretWord } = await request.json();

    if (!secretWord || typeof secretWord !== 'string') {
      return NextResponse.json({ message: 'Secret word is required' }, { status: 400 });
    }

    // Fetch the secret word distribution method for this POAP
    const distributionMethod = await prisma.distributionMethod.findFirst({
      where: {
        poapId: poapId,
        type: 'SecretWord',
        disabled: false,
        deleted: false,
      },
      include: {
        secretWord: true,
      },
    });

    if (!distributionMethod || !distributionMethod.secretWord) {
      return NextResponse.json(
        { message: 'No secret word claim method available for this POAP' },
        { status: 404 }
      );
    }

    // Check if secret word matches
    if (distributionMethod.secretWord.word !== secretWord) {
      return NextResponse.json({ message: 'Incorrect secret word' }, { status: 400 });
    }

    // Check if max claims limit has been reached
    if (
      distributionMethod.secretWord.maxClaims !== null &&
      distributionMethod.secretWord.claimCount >= distributionMethod.secretWord.maxClaims
    ) {
      return NextResponse.json(
        { message: 'Maximum number of claims has been reached' },
        { status: 400 }
      );
    }

    // Check date restrictions if set
    const now = new Date();
    if (
      distributionMethod.secretWord.startDate &&
      new Date(distributionMethod.secretWord.startDate) > now
    ) {
      return NextResponse.json({ message: 'Claim period has not started yet' }, { status: 400 });
    }

    if (
      distributionMethod.secretWord.endDate &&
      new Date(distributionMethod.secretWord.endDate) < now
    ) {
      return NextResponse.json({ message: 'Claim period has ended' }, { status: 400 });
    }

    // Ensure POAP token exists before proceeding
    const tokenResult = await ensurePoapTokenExists(poapId);
    
    if (!tokenResult.success) {
      return NextResponse.json({ message: tokenResult.message || 'Failed to ensure POAP token existence' }, { status: 500 });
    }

    // Use the mint address from the token result
    const mintAddress = tokenResult.mintAddress;
    
    if (!mintAddress) {
      return NextResponse.json({ message: 'POAP token mint address not available' }, { status: 400 });
    }

    // Transfer token to the user's wallet using the function from redeem API
    const mintResult = await transferTokenToWallet(mintAddress, walletAddress);

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
      await prisma.pOAPClaim.create({
        data: {
          id: claimId,
          poapId: poapId,
          walletAddress: walletAddress,
          distributionMethodId: distributionMethod.id,
          transactionSignature: mintResult.signature,
        },
      });
    } catch (error) {
      console.error('Error recording claim:', error);
      // Even if recording fails, the token was transferred, so we consider it a success
    }

    // Increment the claim count
    try {
      await prisma.secretWord.update({
        where: {
          id: distributionMethod.secretWord.id,
        },
        data: {
          claimCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error('Error updating claim count:', error);
      // Non-critical error, continue
    }

    // Return success response
    return NextResponse.json({
      message: 'POAP claimed successfully!',
      hasClaimed: true,
      claimId: claimId,
      claimTimestamp: new Date(),
      claimTxId: mintResult.signature,
    });
  } catch (error) {
    console.error('Secret word claim error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
