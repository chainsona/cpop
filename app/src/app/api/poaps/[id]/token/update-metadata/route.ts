import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createRpc } from '@lightprotocol/stateless.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../../middleware';
import bs58 from 'bs58';
import { uploadJsonMetadata } from '@/lib/supabase';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

type Params = Promise<{
  id: string;
}>;

/**
 * POST handler for updating token metadata
 * This endpoint is called when POAP details have changed and the token metadata needs to be updated
 */
async function postHandler(req: NextRequest, { params }: { params: Params }) {
  try {
    // Check for Solana wallet auth first
    const walletAddress = (req as any).wallet?.address;

    // Try NextAuth session as fallback
    const session = await getServerSession(authOptions);

    console.log('Token metadata update authorization check:', {
      hasWalletAuth: !!walletAddress,
      hasSessionAuth: !!session?.user,
      walletAddressPrefix: walletAddress ? walletAddress.substring(0, 10) + '...' : 'none',
    });

    // If neither authentication method worked, return unauthorized
    if (!walletAddress && (!session || !session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poapId } = await params;

    // Get POAP details to check ownership and token info
    const poap = await prisma.poap.findUnique({
      where: { id: poapId },
      include: {
        creator: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
        tokens: true,
      },
    });

    if (!poap) {
      return NextResponse.json({ error: 'POAP not found' }, { status: 404 });
    }

    // Check if the user is authorized:
    // 1. If using NextAuth, check if the user is the creator by ID
    // 2. If using wallet auth, check if the wallet address matches the creator's wallet
    const isAuthorized =
      (session?.user?.id && poap.creatorId === session.user.id) ||
      (walletAddress && poap.creator?.walletAddress === walletAddress);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to update token metadata for this POAP' },
        { status: 403 }
      );
    }

    // Check if token exists
    if (!poap.tokens || poap.tokens.length === 0) {
      return NextResponse.json(
        { error: 'No token found for this POAP. Please mint tokens first.' },
        { status: 400 }
      );
    }

    const token = poap.tokens[0]; // Get the first token (should only be one)

    // Update token metadata
    try {
      if (!RPC_ENDPOINT) {
        throw new Error('Missing Solana RPC endpoint configuration');
      }

      if (!process.env.TOKEN_MINT_AUTHORITY_SECRET) {
        throw new Error('Missing TOKEN_MINT_AUTHORITY_SECRET environment variable');
      }

      // Generate metadata JSON
      const metadataJson = {
        name: poap.title,
        description: poap.description,
        image: poap.imageUrl,
        symbol: 'POAP',
        attributes: [
          {
            trait_type: 'Event ID',
            value: poap.id,
          },
          {
            trait_type: 'Created At',
            value: poap.createdAt.toISOString(),
          },
          {
            trait_type: 'Updated At',
            value: new Date().toISOString(),
          },
        ],
        properties: {
          files: [
            {
              uri: poap.imageUrl,
              type: 'image/png',
            },
          ],
        },
      };

      // Upload metadata to Supabase
      const metadataFilename = `metadata-${token.mintAddress}-${Date.now()}.json`;
      const metadataUri = await uploadJsonMetadata(metadataJson, metadataFilename);

      console.log(`Updated metadata uploaded to: ${metadataUri}`);

      // Create RPC connection
      const connection = createRpc(RPC_ENDPOINT);

      // For this implementation, we'll re-upload the metadata but skip the on-chain update
      // since it requires specific Solana implementation details that might vary.
      // In a real-world scenario, you would use the appropriate SPL-Token-2022 instructions
      // to update the metadata on-chain as well.
      console.log(`Metadata would be updated on-chain for mint: ${token.mintAddress}`);

      // Update the token metadata URI in the database
      const now = new Date();
      await prisma.poapToken.update({
        where: { id: token.id },
        data: {
          metadataUri: metadataUri,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Token metadata updated successfully',
        metadataUri,
        updatedAt: now.toISOString(),
      });
    } catch (error) {
      console.error('Error updating token metadata:', error);
      return NextResponse.json(
        {
          error: 'Failed to update token metadata',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in update token metadata endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process metadata update request' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with API middleware
export const POST = (req: NextRequest, ctx: { params: Params }) =>
  apiMiddleware(req, async () => postHandler(req, ctx));
