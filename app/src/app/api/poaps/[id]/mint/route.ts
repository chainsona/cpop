import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { confirmTx, createRpc } from '@lightprotocol/stateless.js';
import { compress, createTokenPool } from '@lightprotocol/compressed-token';
import {
  getOrCreateAssociatedTokenAccount,
  mintTo as mintToSpl,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  ExtensionType,
  getMintLen,
  LENGTH_SIZE,
  TYPE_SIZE,
} from '@solana/spl-token';
import {
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  PublicKey,
} from '@solana/web3.js';
import { createInitializeInstruction, pack, TokenMetadata } from '@solana/spl-token-metadata';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../middleware';
import bs58 from 'bs58';
import { uploadJsonMetadata } from '@/lib/supabase';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

// Interface for POAP data
interface PoapData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  [key: string]: any; // Allow additional properties
}

type Params = {
  id: string;
};

// POST handler for minting tokens
async function mintHandler(request: Request, { params }: { params: Promise<Params> }) {
  try {
    // Check for Solana wallet auth first
    const walletAddress = (request as any).wallet?.address;

    // Try NextAuth session as fallback
    const session = await getServerSession(authOptions);

    console.log('Mint authorization check:', {
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

    // Check if token already exists
    const token = await prisma.poapToken.findFirst({
      where: { poapId },
    });

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

    // If tokens are already minted, return success message
    if (token) {
      return NextResponse.json({
        success: true,
        message: 'Tokens already minted',
        mintAddress: token.mintAddress,
      });
    }

    // Get all distribution methods to calculate total token supply
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: {
        poapId,
        disabled: false, // Only include active methods
      },
    });

    if (distributionMethods.length === 0) {
      return NextResponse.json({ error: 'No active distribution methods found' }, { status: 400 });
    }

    // Mint tokens
    try {
      let mintAddress = '';

      if (!RPC_ENDPOINT) {
        throw new Error('Missing Solana RPC endpoint configuration');
      }

      mintAddress = await mintCompressedTokens(poap as PoapData);

      return NextResponse.json({
        success: true,
        message: 'Tokens minted successfully',
        mintAddress,
      });
    } catch (error) {
      console.error('Error minting tokens:', error);
      return NextResponse.json(
        {
          error: 'Failed to mint tokens',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in mint endpoint:', error);
    return NextResponse.json({ error: 'Failed to process minting request' }, { status: 500 });
  }
}

// Export the handler wrapped with API middleware
export const POST = (request: NextRequest, ctx: { params: Promise<Params> }) =>
  apiMiddleware(request, async () => mintHandler(request as Request, ctx));

// Function to mint compressed tokens - internal implementation
async function mintCompressedTokens(poap: PoapData): Promise<string> {
  if (!RPC_ENDPOINT) {
    throw new Error('Missing Solana RPC endpoint configuration');
  }

  if (!process.env.TOKEN_MINT_AUTHORITY_SECRET) {
    throw new Error('Missing TOKEN_MINT_AUTHORITY_SECRET environment variable');
  }

  // Create RPC connection
  const connection = createRpc(RPC_ENDPOINT);

  // Get the token mint authority from environment
  const mintAuthority = Keypair.fromSecretKey(bs58.decode(process.env.TOKEN_MINT_AUTHORITY_SECRET));

  // For payer, we can use the same wallet or a different wallet
  const payer = mintAuthority;

  // Generate a mint keypair
  const mint = Keypair.generate();

  const decimals = 0; // No decimal places for NFT-like tokens

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
  const metadataFilename = `metadata-${mint.publicKey.toString()}.json`;
  const metadataUri = await uploadJsonMetadata(metadataJson, metadataFilename);

  console.log(`Metadata uploaded to: ${metadataUri}`);

  // Create token metadata with the uploaded metadata URI
  const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: poap.title,
    symbol: 'POAP',
    uri: metadataUri, // Use the Supabase metadata URI
    additionalMetadata: [
      ['description', poap.description],
      ['event_id', poap.id],
      ['created_at', poap.createdAt.toISOString()],
    ],
  };

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

  // Request minimum lamports for account rent
  const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

  // Create the mint transaction
  const mintTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeMetadataPointerInstruction(
      mint.publicKey,
      payer.publicKey,
      mint.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      mintAuthority.publicKey, // Use the mint authority from env var
      null,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: mint.publicKey,
      metadata: mint.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: mintAuthority.publicKey, // Use the mint authority from env var
      updateAuthority: mintAuthority.publicKey, // Use the mint authority from env var
    })
  );

  // Send and confirm the mint transaction
  const txId = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mint]);
  console.log(`Mint created: ${txId}`);

  // Register the mint with the Compressed-Token program
  const poolTxId = await createTokenPool(
    connection,
    payer,
    mint.publicKey,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`Token pool registered: ${poolTxId}`);

  // Create an associated token account for the payer
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint.publicKey,
    payer.publicKey,
    undefined,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // Always mint 0 tokens initially regardless of the amount parameter
  const mintSplTxId = await mintToSpl(
    connection,
    payer,
    mint.publicKey,
    ata.address,
    mintAuthority.publicKey,
    0, // Always use 0 for initial supply
    [mintAuthority],
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`SPL tokens minted: ${mintSplTxId}`);

  // Compress the tokens - with 0 amount
  const compressTxId = await compress(
    connection,
    payer,
    mint.publicKey,
    0, // Always use 0 for initial supply
    payer,
    ata.address,
    payer.publicKey
  );
  console.log(`Tokens compressed: ${compressTxId}`);

  // Save mint info to database
  await prisma.poapToken.create({
    data: {
      poapId: poap.id,
      mintAddress: mint.publicKey.toString(),
      metadataUri, // Store the metadata URI
    },
  });

  return mint.publicKey.toString();
}
