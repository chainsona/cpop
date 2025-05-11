import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { confirmTx, createRpc } from '@lightprotocol/stateless.js';
import { compress, createTokenPool } from '@lightprotocol/compressed-token';
import {
  getOrCreateAssociatedTokenAccount,
  mintTo as mintToSpl,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Keypair, sendAndConfirmTransaction, Transaction, PublicKey } from '@solana/web3.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../../middleware';
import bs58 from 'bs58';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

type Params = {
  id: string;
};

/**
 * Function to mint additional tokens for a POAP
 * Made available for direct server usage
 */
async function mintAdditionalTokens(
  poapId: string,
  additionalSupply: number
): Promise<{ mintAddress: string }> {
  if (!RPC_ENDPOINT) {
    throw new Error('Missing Solana RPC endpoint configuration');
  }

  if (!process.env.TOKEN_MINT_AUTHORITY_SECRET) {
    throw new Error('Missing TOKEN_MINT_AUTHORITY_SECRET environment variable');
  }

  // Check if token exists
  const token = await prisma.poapToken.findFirst({
    where: { poapId },
  });

  if (!token) {
    throw new Error('No token found for this POAP. Please mint tokens first.');
  }

  // Create RPC connection
  const connection = createRpc(RPC_ENDPOINT);

  // Get the token mint authority from environment
  const mintAuthority = Keypair.fromSecretKey(bs58.decode(process.env.TOKEN_MINT_AUTHORITY_SECRET));

  // For payer, we can use the same wallet or a different wallet
  const payer = mintAuthority;

  // Get the mint address from the token record
  const mintAddress = new PublicKey(token.mintAddress);

  // Create an associated token account for the payer
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintAddress,
    payer.publicKey,
    undefined,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // Mint additional SPL tokens - Use the mintAuthority for signing
  const mintSplTxId = await mintToSpl(
    connection,
    payer,
    mintAddress,
    ata.address,
    mintAuthority.publicKey,
    additionalSupply,
    [mintAuthority],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`Additional SPL tokens minted: ${mintSplTxId}`);

  // Compress the additional tokens
  const compressTxId = await compress(
    connection,
    payer,
    mintAddress,
    additionalSupply,
    payer,
    ata.address,
    payer.publicKey
  );
  console.log(`Additional tokens compressed: ${compressTxId}`);

  // Update token supply in the database
  await prisma.poapToken.update({
    where: { id: token.id },
    data: {
      // We don't store supply in PoapToken model
    },
  });

  return {
    mintAddress: token.mintAddress,
  };
}

// POST handler for minting additional tokens
async function postHandler(request: Request, { params }: { params: Promise<Params> }) {
  try {
    // Check for Solana wallet auth first
    const walletAddress = (request as any).wallet?.address;

    // Try NextAuth session as fallback
    const session = await getServerSession(authOptions);

    console.log('Mint additional tokens authorization check:', {
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
        { error: 'You do not have permission to mint tokens for this POAP' },
        { status: 403 }
      );
    }

    // Parse request body to get the additional supply amount
    const body = await request.json();
    const additionalSupply = Number(body.additionalSupply) || 0;

    if (additionalSupply <= 0) {
      return NextResponse.json(
        { success: true, message: 'No additional supply needed' },
        { status: 200 }
      );
    }

    try {
      const result = await mintAdditionalTokens(poapId, additionalSupply);

      return NextResponse.json({
        success: true,
        message: 'Additional tokens minted successfully',
        additionalSupply,
        mintAddress: result.mintAddress,
      });
    } catch (error) {
      console.error('Error minting additional tokens:', error);
      return NextResponse.json(
        {
          error: 'Failed to mint additional tokens',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in mint additional tokens endpoint:', error);
    return NextResponse.json({ error: 'Failed to process minting request' }, { status: 500 });
  }
}

// Export the handler wrapped with API middleware
export const POST = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => postHandler(request as Request, ctx));
