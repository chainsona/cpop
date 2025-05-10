import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
import {
  mintTokensAfterDistributionCreated,
  calculateAdditionalSupplyNeeded,
  mintAdditionalTokenSupply,
} from '@/lib/poap-utils';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

// Interface for POAP data
interface PoapData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tokenMinted: boolean;
  createdAt: Date;
  [key: string]: any; // Allow additional properties
}

interface Params {
  id: string;
}

// Helper to check user authorization for a POAP
async function checkUserAuthorization(req: NextRequest, poapId: string): Promise<boolean> {
  // Get user from session
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // For wallet-based auth, get wallet from request
  const walletAddress = (req as any).wallet?.address;

  // If neither session nor wallet, user is not authorized
  if (!userId && !walletAddress) {
    return false;
  }

  // First, fetch the POAP with its creator
  const poap = await prisma.poap.findUnique({
    where: { id: poapId },
    select: { creatorId: true },
  });

  if (!poap || !poap.creatorId) {
    return false;
  }

  // If user ID from session matches creator ID, they're authorized
  if (userId && poap.creatorId === userId) {
    return true;
  }

  // If using wallet auth, check if walletAddress matches a user that is the creator
  if (walletAddress) {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (user && poap.creatorId === user.id) {
      return true;
    }
  }

  // No conditions for authorization were met
  return false;
}

// GET handler to retrieve distribution methods
async function getHandler(req: NextRequest, context: { params: Params }) {
  try {
    const { id: poapId } = await context.params;

    // Check authorization
    const isAuthorized = await checkUserAuthorization(req, poapId);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: You do not have permission to access distribution methods for this POAP',
        },
        { status: 403 }
      );
    }

    // Fetch distribution methods for this POAP
    const distributionMethods = await prisma.distributionMethod.findMany({
      where: { poapId, deleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        claimLinks: true,
        secretWord: true,
        locationBased: true,
      },
    });

    return NextResponse.json({ distributionMethods });
  } catch (error) {
    console.error('Error fetching distribution methods:', error);
    return NextResponse.json({ error: 'Failed to fetch distribution methods' }, { status: 500 });
  }
}

// POST handler to create a new distribution method
async function postHandler(req: NextRequest, context: { params: Params }) {
  try {
    const { id: poapId } = await context.params;

    // Check authorization
    const isAuthorized = await checkUserAuthorization(req, poapId);

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: You do not have permission to create distribution methods for this POAP',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate distribution method type
    if (!body.type || !['ClaimLinks', 'SecretWord', 'LocationBased'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid distribution method type' }, { status: 400 });
    }

    // Create a new distribution method
    const distributionMethod = await prisma.distributionMethod.create({
      data: {
        poapId,
        type: body.type,
      },
    });

    // For specific distribution types, create their related data
    switch (body.type) {
      case 'SecretWord':
        if (!body.word) {
          return NextResponse.json({ error: 'Secret word is required' }, { status: 400 });
        }

        await prisma.secretWord.create({
          data: {
            distributionMethodId: distributionMethod.id,
            word: body.word,
            maxClaims: body.maxClaims || null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
          },
        });
        break;

      case 'LocationBased':
        if (!body.city) {
          return NextResponse.json(
            { error: 'City is required for location-based distribution' },
            { status: 400 }
          );
        }

        await prisma.locationBased.create({
          data: {
            distributionMethodId: distributionMethod.id,
            city: body.city,
            country: body.country || null,
            latitude: body.latitude || null,
            longitude: body.longitude || null,
            radius: body.radius || 500,
            maxClaims: body.maxClaims || null,
            startDate: body.startDate ? new Date(body.startDate) : null,
            endDate: body.endDate ? new Date(body.endDate) : null,
          },
        });
        break;

      case 'ClaimLinks':
        // For claim links, we'll create them in a separate API call
        break;
    }

    // Check if tokens are already minted for this POAP
    const existingToken = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    // Token generation/update handling in the background
    try {
      if (!existingToken) {
        // Mint new token if one doesn't exist
        console.log(`No existing token found for POAP ${poapId}. Creating new token.`);
        mintTokensAfterDistributionCreated(poapId)
          .then(result => {
            if (result?.success) {
              console.log(
                `Tokens auto-minted after distribution method creation: ${result.mintAddress}`
              );
            }
          })
          .catch(error => {
            console.error('Error auto-minting tokens:', error);
          });
      } else {
        // If token exists, calculate and mint additional supply if needed
        console.log(`Existing token found for POAP ${poapId}. Checking for additional supply.`);

        calculateAdditionalSupplyNeeded(distributionMethod.id)
          .then(additionalSupply => {
            if (additionalSupply > 0) {
              console.log(`Minting additional ${additionalSupply} tokens for POAP ${poapId}`);
              return mintAdditionalTokenSupply(poapId, additionalSupply);
            } else {
              console.log(`No additional supply needed for POAP ${poapId}`);
              return null;
            }
          })
          .then(result => {
            if (result?.success) {
              console.log(
                `Additional tokens minted: ${result.additionalSupply} tokens, new total: ${result.newTotalSupply}`
              );
            }
          })
          .catch(error => {
            console.error('Error handling additional token supply:', error);
          });
      }
    } catch (error) {
      // Don't let token minting failure prevent distribution method creation
      console.error('Error in token handling:', error);
    }

    return NextResponse.json({
      success: true,
      distributionMethod,
    });
  } catch (error) {
    console.error('Error creating distribution method:', error);
    return NextResponse.json({ error: 'Failed to create distribution method' }, { status: 500 });
  }
}

// Export wrapped handlers with auth middleware
export const GET = (req: NextRequest, ctx: { params: Params }) =>
  apiMiddleware(req, async () => getHandler(req, ctx));

export const POST = (req: NextRequest, ctx: { params: Params }) =>
  apiMiddleware(req, async () => postHandler(req, ctx));

// Function to mint compressed tokens for the first time
async function mintCompressedTokens(poap: PoapData, amount: number) {
  if (!RPC_ENDPOINT) {
    throw new Error('Missing Solana RPC endpoint configuration');
  }

  // Create RPC connection
  const connection = createRpc(RPC_ENDPOINT);

  // Retrieve or create wallet from environment
  const payer = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.SOLANA_WALLET_SECRET || '[]'))
  );

  // Generate a mint keypair
  const mint = Keypair.generate();

  const decimals = 0; // No decimal places for NFT-like tokens

  // Create token metadata
  const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: poap.title,
    symbol: 'POAP',
    uri: poap.imageUrl, // Could be replaced with IPFS metadata URI
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
      payer.publicKey,
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
      mintAuthority: payer.publicKey,
      updateAuthority: payer.publicKey,
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

  // Mint SPL tokens
  const mintSplTxId = await mintToSpl(
    connection,
    payer,
    mint.publicKey,
    ata.address,
    payer.publicKey,
    amount,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`SPL tokens minted: ${mintSplTxId}`);

  // Compress the tokens
  const compressTxId = await compress(
    connection,
    payer,
    mint.publicKey,
    amount,
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
      supply: amount,
      decimals,
    },
  });

  return mint.publicKey.toString();
}

// Function to mint additional tokens when new distribution methods are added
async function mintAdditionalTokens(poap: PoapData, additionalAmount: number) {
  if (!RPC_ENDPOINT) {
    throw new Error('Missing Solana RPC endpoint configuration');
  }

  // Create RPC connection
  const connection = createRpc(RPC_ENDPOINT);

  // Retrieve wallet from environment
  const payer = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.SOLANA_WALLET_SECRET || '[]'))
  );

  // Get existing token information
  const tokenInfo = await prisma.poapToken.findFirst({
    where: { poapId: poap.id },
  });

  if (!tokenInfo || !tokenInfo.mintAddress) {
    throw new Error('Token mint not found');
  }

  const mintAddress = new PublicKey(tokenInfo.mintAddress);

  // Create an associated token account for the payer if needed
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

  // Mint additional SPL tokens
  const mintSplTxId = await mintToSpl(
    connection,
    payer,
    mintAddress,
    ata.address,
    payer.publicKey,
    additionalAmount,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  console.log(`Additional SPL tokens minted: ${mintSplTxId}`);

  // Compress the additional tokens
  const compressTxId = await compress(
    connection,
    payer,
    mintAddress,
    additionalAmount,
    payer,
    ata.address,
    payer.publicKey
  );
  console.log(`Additional tokens compressed: ${compressTxId}`);

  // Update token supply in database
  await prisma.poapToken.update({
    where: { id: tokenInfo.id },
    data: {
      supply: { increment: additionalAmount },
    },
  });

  return mintAddress.toString();
}
