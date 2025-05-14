import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PublicKey, Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { resolve } from '@bonfida/spl-name-service';
import {
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  mintTo,
} from '@solana/spl-token';
import { createRpc } from '@lightprotocol/stateless.js';
import bs58 from 'bs58';
import { mintTokensAfterDistributionCreated } from '@/lib/pop-utils';
import { solanaPay } from '../../middleware';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

interface Params {
  token: string;
}

/**
 * Resolves a .sol domain name to a wallet address or returns the original address if it's a valid public key
 */
async function resolveWalletAddress(addressOrDomain: string): Promise<string> {
  // Check if it's a .sol domain
  if (addressOrDomain.toLowerCase().endsWith('.sol')) {
    try {
      const connection = new Connection(clusterApiUrl('mainnet-beta'));
      const domainName = addressOrDomain.slice(0, -4);
      const ownerPublicKey = await resolve(connection, domainName);
      return ownerPublicKey.toBase58();
    } catch (error) {
      console.error('Error resolving SNS domain:', error);
      throw new Error(`Invalid SNS domain: ${addressOrDomain}`);
    }
  }

  // If not a .sol domain, verify it's a valid Solana public key
  try {
    const publicKey = new PublicKey(addressOrDomain);
    return publicKey.toBase58();
  } catch (error) {
    throw new Error(`Invalid Solana wallet address: ${addressOrDomain}`);
  }
}

/**
 * Transfers tokens to a claiming wallet
 */
async function transferTokenToWallet(
  mintAddress: string,
  destinationWallet: string
): Promise<string> {
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

  // For payer, we use the same wallet as the mint authority
  const payer = mintAuthority;

  // Get the mint address
  const mintPublicKey = new PublicKey(mintAddress);

  // Get the destination wallet
  const destinationPublicKey = new PublicKey(destinationWallet);

  // Create or get an associated token account for the mint authority (source)
  const sourceAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPublicKey,
    payer.publicKey,
    undefined,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  // Create or get an associated token account for the destination wallet
  const destinationAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPublicKey,
    destinationPublicKey,
    undefined,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  try {
    // Check source account balance
    const sourceAccount = await getAccount(
      connection,
      sourceAta.address,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    if (Number(sourceAccount.amount) >= 1) {
      // If authority has tokens, proceed with transfer
      const transferTx = await transfer(
        connection,
        payer,
        sourceAta.address,
        destinationAta.address,
        payer.publicKey,
        1, // Transfer 1 token
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      return transferTx;
    }
  } catch (error) {
    // If account doesn't exist or any other error, log it but continue to mint
    console.log('Error checking source account, will mint directly:', error);
  }

  // Mint 1 token directly to the destination
  const mintTx = await mintTo(
    connection,
    payer,
    mintPublicKey,
    destinationAta.address,
    mintAuthority.publicKey,
    1, // Mint 1 token
    [mintAuthority], // Provide the mint authority for signing
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  return mintTx;
}

/**
 * Check if POP token exists and create it if not
 */
async function ensurePopTokenExists(
  popId: string
): Promise<{ success: boolean; mintAddress?: string; message?: string }> {
  try {
    // Check if token already exists
    const existingToken = await prisma.popToken.findFirst({
      where: { popId },
    });

    if (existingToken && existingToken.mintAddress) {
      return {
        success: true,
        mintAddress: existingToken.mintAddress,
      };
    }

    // Token doesn't exist, create it
    const mintResult = await mintTokensAfterDistributionCreated(popId);

    if (!mintResult || !mintResult.success) {
      const errorMessage = mintResult?.message || 'Failed to create POP token';
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
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error checking/creating POP token',
    };
  }
}

// GET handler for Solana Pay - returns label and icon
export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  // Pass to our middleware wrapper that explicitly bypasses auth
  return solanaPay(request as any, () => getHandler(request, params));
}

// Actual GET handler implementation
async function getHandler(request: Request, params: Promise<Params>) {
  const { token } = await params;

  try {
    // Fetch claim link to get POP details
    const claimLink = await prisma.claimLink.findUnique({
      where: { token },
      include: {
        distributionMethod: {
          include: {
            pop: true,
          },
        },
      },
    });

    if (!claimLink) {
      return NextResponse.json({ error: 'Claim link not found' }, { status: 404 });
    }

    const popName = claimLink.distributionMethod.pop.title || 'POP Token Claim';
    const icon = process.env.NEXT_PUBLIC_APP_ICON_URL || 'https://cpop.maikers.com/favicon.ico';

    return NextResponse.json({
      label: popName,
      icon,
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// POST handler for Solana Pay - returns transaction
export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  // Pass to our middleware wrapper that explicitly bypasses auth
  return solanaPay(request as any, () => postHandler(request, params));
}

// Actual POST handler implementation
async function postHandler(request: Request, params: Promise<Params>) {
  try {
    const { token } = await params;

    // Get the wallet address from the request body (provided by Solana Pay)
    const body = await request.json();
    const walletAddress = body.account;
    
    console.log('[Solana Pay] Processing claim request for token:', token, 'from wallet:', walletAddress);

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Verify it's a valid wallet address
    let resolvedWalletAddress: string;
    try {
      resolvedWalletAddress = await resolveWalletAddress(walletAddress);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Fetch claim link with distribution method details
    const claimLink = await prisma.claimLink.findUnique({
      where: { token },
      include: {
        distributionMethod: {
          include: {
            pop: {
              include: {
                tokens: true,
              },
            },
          },
        },
      },
    });

    // Validate claim link
    if (!claimLink) {
      return NextResponse.json({ error: 'Claim link not found' }, { status: 404 });
    }

    if (claimLink.distributionMethod.disabled || claimLink.distributionMethod.deleted) {
      return NextResponse.json(
        { error: 'This distribution method has been disabled' },
        { status: 403 }
      );
    }

    if (claimLink.claimed) {
      return NextResponse.json({ error: 'This POP has already been claimed' }, { status: 403 });
    }

    if (claimLink.expiresAt && new Date(claimLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This claim link has expired' }, { status: 403 });
    }

    // Check if POP token exists and has been minted
    const popTokens = claimLink.distributionMethod.pop.tokens;
    let mintAddress: string;

    if (!popTokens || popTokens.length === 0 || !popTokens[0].mintAddress) {
      // Try to create the POP token
      const popId = claimLink.distributionMethod.pop.id;
      const tokenResult = await ensurePopTokenExists(popId);

      if (!tokenResult.success || !tokenResult.mintAddress) {
        return NextResponse.json({ error: 'Failed to create POP token' }, { status: 500 });
      }

      mintAddress = tokenResult.mintAddress;
    } else {
      // Use existing token
      mintAddress = popTokens[0].mintAddress;
    }

    // Create the transaction
    try {
      // Generate transaction
      const transactionSignature = await transferTokenToWallet(mintAddress, resolvedWalletAddress);

      // Convert transaction signature to base64 for Solana Pay response
      const message = `Claim your ${claimLink.distributionMethod.pop.title || 'POP'} token`;

      // In a real implementation, we would create and serialize a transaction here,
      // but since we're directly executing the transaction server-side in our implementation,
      // we'll mark the claim as processed when the transaction is created

      // Mark the claim link as claimed
      await prisma.claimLink.update({
        where: { id: claimLink.id },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimedByWallet: resolvedWalletAddress,
          transactionSignature,
        },
      });

      return NextResponse.json({
        transaction: transactionSignature, // In real Solana Pay, this would be a base64 serialized transaction
        message,
      });
    } catch (error) {
      console.error('Error generating transaction:', error);
      return NextResponse.json({ error: 'Failed to generate transaction' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 }); // No content
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  console.log('[Solana Pay] Handling OPTIONS preflight request');
  return response;
}
