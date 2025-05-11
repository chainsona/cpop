import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PublicKey, Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { resolve } from '@bonfida/spl-name-service';
import fs from 'fs';
import path from 'path';
import {
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  mintTo,
} from '@solana/spl-token';
import { createRpc } from '@lightprotocol/stateless.js';
import bs58 from 'bs58';
import { mintTokensAfterDistributionCreated } from '@/lib/poap-utils';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

interface Params {
  token: string;
}

// Temporary storage for claim data until database schema is fully updated
interface ClaimRecord {
  claimLinkId: string;
  walletAddress: string;
  originalInput?: string;
  timestamp: string;
  transactionSignature: string;
}

/**
 * Store claim data in a temporary JSON file until database schema is updated
 */
function storeClaimData(data: ClaimRecord): void {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, 'claim_records.json');

    // Read existing records or create new array
    let records: ClaimRecord[] = [];
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      records = JSON.parse(fileContent);
    }

    // Add new record
    records.push(data);

    // Write back to file
    fs.writeFileSync(logFile, JSON.stringify(records, null, 2), 'utf8');
    console.log(`Claim record saved to ${logFile}`);
  } catch (error) {
    console.error('Failed to store claim data in fallback file:', error);
  }
}

/**
 * Logs claim attempts for auditing purposes
 */
function logClaimAttempt(data: {
  claimLinkId: string;
  walletAddress: string;
  success: boolean;
  errorMessage?: string;
  transactionSignature?: string;
}) {
  console.log(
    `Claim Attempt: ${data.success ? 'SUCCESS' : 'FAILED'} | ` +
      `Link: ${data.claimLinkId} | ` +
      `Wallet: ${data.walletAddress} | ` +
      `TxID: ${data.transactionSignature || 'N/A'} | ` +
      `Error: ${data.errorMessage || 'N/A'}`
  );
}

/**
 * Resolves a .sol domain name to a wallet address or returns the original address if it's a valid public key
 * @param addressOrDomain A .sol domain or a wallet address
 * @returns The resolved wallet address
 */
async function resolveWalletAddress(addressOrDomain: string): Promise<string> {
  // Check if it's a .sol domain
  if (addressOrDomain.toLowerCase().endsWith('.sol')) {
    try {
      const connection = new Connection(clusterApiUrl('mainnet-beta'));
      // Extract the domain name without .sol extension
      const domainName = addressOrDomain.slice(0, -4);
      // Resolve the domain to a public key
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
 * @param mintAddress The mint address of the token
 * @param destinationWallet The wallet address to send tokens to
 * @returns The transaction signature
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
  console.log('Mint authority public key:', mintAuthority.publicKey.toBase58());

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

    console.log(`Current authority token balance: ${sourceAccount.amount}`);

    if (Number(sourceAccount.amount) >= 1) {
      // If authority has tokens, proceed with transfer
      console.log('Authority has sufficient tokens. Proceeding with transfer...');
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
      console.log(`Token transferred: ${transferTx}`);
      return transferTx;
    } else {
      console.log('No tokens in authority account. Minting directly to destination...');
    }
  } catch (error) {
    // If account doesn't exist or any other error, log it but continue to mint
    console.log('Error checking source account, will mint directly:', error);
  }

  // If we reach here, either the authority has no tokens or there was an error
  // Mint directly to the destination instead
  console.log('Minting new token directly to destination wallet');

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

  console.log(`Token minted directly to destination: ${mintTx}`);
  return mintTx;
}

/**
 * Check if POAP token exists and create it if not
 * @param poapId The ID of the POAP
 * @returns Success status and mint address if successful
 */
async function ensurePoapTokenExists(
  poapId: string
): Promise<{ success: boolean; mintAddress?: string; message?: string }> {
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
      message:
        error instanceof Error ? error.message : 'Unknown error checking/creating POAP token',
    };
  }
}

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { token } = await params;

    // Parse request body
    const body = await request.json();
    const { walletAddress } = body;

    // Enhanced wallet address validation
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.trim() === '') {
      return NextResponse.json(
        {
          error: 'Wallet address is required',
        },
        { status: 400 }
      );
    }

    // Normalize the wallet address by trimming any whitespace
    const normalizedInput = walletAddress.trim();

    // Resolve the wallet address (handle both direct addresses and .sol domains)
    let resolvedWalletAddress: string;
    try {
      resolvedWalletAddress = await resolveWalletAddress(normalizedInput);
    } catch (e) {
      return NextResponse.json(
        {
          error: e instanceof Error ? e.message : 'Invalid wallet address or domain',
        },
        { status: 400 }
      );
    }

    // Fetch claim link with distribution method details
    const claimLink = await prisma.claimLink.findUnique({
      where: { token },
      include: {
        distributionMethod: {
          include: {
            poap: {
              include: {
                tokens: true,
              },
            },
          },
        },
      },
    });

    // If claim link not found
    if (!claimLink) {
      return NextResponse.json(
        {
          error: 'Claim link not found',
        },
        { status: 404 }
      );
    }

    // Check if distribution method is disabled or deleted
    if (claimLink.distributionMethod.disabled || claimLink.distributionMethod.deleted) {
      return NextResponse.json(
        {
          error: 'This distribution method has been disabled',
        },
        { status: 403 }
      );
    }

    // Check if claim link is already claimed
    if (claimLink.claimed) {
      return NextResponse.json(
        {
          error: 'This POAP has already been claimed',
        },
        { status: 403 }
      );
    }

    // Check if claim link is expired
    if (claimLink.expiresAt && new Date(claimLink.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'This claim link has expired',
        },
        { status: 403 }
      );
    }

    // Check if POAP token exists and has been minted
    const poapTokens = claimLink.distributionMethod.poap.tokens;
    let mintAddress: string;

    if (!poapTokens || poapTokens.length === 0 || !poapTokens[0].mintAddress) {
      // Instead of returning an error, try to create the POAP token
      console.log('POAP token not found, attempting to create it');

      const poapId = claimLink.distributionMethod.poap.id;
      const tokenResult = await ensurePoapTokenExists(poapId);

      if (!tokenResult.success) {
        return NextResponse.json(
          {
            error: 'Failed to create POAP token',
            message: tokenResult.message,
          },
          { status: 500 }
        );
      }

      // Use the newly created token
      if (!tokenResult.mintAddress) {
        return NextResponse.json(
          {
            error: 'POAP token creation succeeded but mint address is missing',
          },
          { status: 500 }
        );
      }

      mintAddress = tokenResult.mintAddress;
    } else {
      // Use the existing token
      mintAddress = poapTokens[0].mintAddress;
    }

    // Track if this was a .sol domain resolution
    const wasSolDomain = normalizedInput.toLowerCase().endsWith('.sol');

    // Transfer token to the claiming wallet
    let transactionSignature: string;
    try {
      transactionSignature = await transferTokenToWallet(mintAddress, resolvedWalletAddress);
    } catch (transferError) {
      console.error('Error transferring token:', transferError);
      return NextResponse.json(
        {
          error: 'Failed to transfer token',
          message:
            transferError instanceof Error ? transferError.message : 'An unknown error occurred',
        },
        { status: 500 }
      );
    }

    // Mark the claim link as claimed with wallet information
    try {
      await prisma.claimLink.update({
        where: { id: claimLink.id },
        data: {
          claimed: true,
          claimedAt: new Date(),
          claimedByWallet: resolvedWalletAddress, // Store the resolved wallet address
          transactionSignature,
        },
      });

      // Store additional claim data for logging
      storeClaimData({
        claimLinkId: claimLink.id,
        walletAddress: resolvedWalletAddress,
        originalInput: wasSolDomain ? normalizedInput : undefined,
        timestamp: new Date().toISOString(),
        transactionSignature,
      });

      logClaimAttempt({
        claimLinkId: claimLink.id,
        walletAddress: resolvedWalletAddress,
        success: true,
        transactionSignature,
      });
    } catch (updateError) {
      console.warn('Failed to update claim with extended fields, trying basic update', updateError);

      // Even if the full update fails, try to at least mark as claimed
      // This is a critical update that must succeed
      const updateData: any = {
        claimed: true,
        claimedAt: new Date(),
      };

      // Always try to include the wallet address in this fallback update
      // as it's a core piece of information
      try {
        updateData.claimedByWallet = resolvedWalletAddress;
        await prisma.claimLink.update({
          where: { id: claimLink.id },
          data: updateData,
        });

        logClaimAttempt({
          claimLinkId: claimLink.id,
          walletAddress: resolvedWalletAddress,
          success: true,
          errorMessage: 'Stored claim with limited fields',
        });
      } catch (finalError) {
        // Last resort update - only mark as claimed if nothing else works
        await prisma.claimLink.update({
          where: { id: claimLink.id },
          data: {
            claimed: true,
            claimedAt: new Date(),
          },
        });

        console.error('Failed to store wallet address in database:', finalError);

        // Still log the wallet address in our logs even if we couldn't store it in DB
        logClaimAttempt({
          claimLinkId: claimLink.id,
          walletAddress: resolvedWalletAddress,
          success: true,
          errorMessage: 'Could not store wallet address in database',
        });
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'POAP claimed successfully',
      claim: {
        claimLinkId: claimLink.id,
        status: 'COMPLETED',
        walletAddress: {
          resolved: resolvedWalletAddress,
          original: wasSolDomain ? normalizedInput : resolvedWalletAddress,
          wasSolDomain: wasSolDomain,
        },
        mintAddress: mintAddress,
        transactionSignature,
        claimedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error claiming POAP:', error);

    // Log the failed claim attempt - we can't reference variables inside the try block
    // so we'll just log what we know from the error context
    logClaimAttempt({
      claimLinkId: 'unknown', // We don't have access to claimLink here
      walletAddress: 'unknown', // We don't have access to normalizedWalletAddress here
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to claim POAP',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
