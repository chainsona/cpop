import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { createRpc } from '@lightprotocol/stateless.js';
import bs58 from 'bs58';
import { prisma } from './prisma';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

/**
 * Transfers tokens to a claiming wallet
 * @param mintAddress The mint address of the token
 * @param destinationWallet The wallet address to send tokens to
 * @returns The transaction signature
 */
export async function transferTokenToWallet(
  mintAddress: string,
  destinationWallet: string
): Promise<{ success: boolean; signature?: string; message?: string }> {
  try {
    if (!RPC_ENDPOINT) {
      throw new Error('Missing Solana RPC endpoint configuration');
    }

    if (!process.env.TOKEN_MINT_AUTHORITY_SECRET) {
      throw new Error('Missing TOKEN_MINT_AUTHORITY_SECRET environment variable');
    }

    // Create RPC connection
    const connection = createRpc(RPC_ENDPOINT);

    // Get the token mint authority from environment
    const mintAuthority = Keypair.fromSecretKey(
      bs58.decode(process.env.TOKEN_MINT_AUTHORITY_SECRET)
    );
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
        return {
          success: true,
          signature: transferTx,
        };
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
    return {
      success: true,
      signature: mintTx,
    };
  } catch (error) {
    console.error('Error in transferTokenToWallet:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error in token transfer',
    };
  }
}

// Get all token accounts for a given wallet address
export async function getTokensForWallet(walletAddress: string) {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
  );
  const pubKey = new PublicKey(walletAddress);

  try {
    // Get Token2022 accounts specifically
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    console.log(
      `Found ${tokenAccounts.value.length} Token2022 accounts for wallet ${walletAddress.substring(0, 6)}...`
    );

    return tokenAccounts.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      amount: account.account.data.parsed.info.tokenAmount.uiAmount,
      decimals: account.account.data.parsed.info.tokenAmount.decimals,
      isCompressed: true, // These are all Token2022 tokens
    }));
  } catch (error) {
    console.error('Error fetching Token2022 accounts:', error);
    throw error;
  }
}

// Get POAP tokens from database by mint addresses
export async function getPOAPsByMints(mintAddresses: string[]) {
  if (!mintAddresses.length) return [];

  try {
    // Since we can't directly query by mint address in POAP (schema mismatch),
    // let's first find the claims with matching mint addresses
    const claims = await prisma.pOAPClaim.findMany({
      where: {
        mintAddress: {
          in: mintAddresses,
        },
      },
      select: {
        poapId: true,
        mintAddress: true,
        transactionSignature: true,
        createdAt: true,
      },
    });

    // Then get the POAPs for the found claims
    const poapIds = [...new Set(claims.map(claim => claim.poapId))];
    const poaps = await prisma.poap.findMany({
      where: {
        id: {
          in: poapIds,
        },
      },
    });

    // Associate the claims with their POAPs
    return poaps.map(poap => {
      const relatedClaims = claims.filter(claim => claim.poapId === poap.id);
      return {
        ...poap,
        claims: relatedClaims,
      };
    });
  } catch (error) {
    console.error('Error fetching POAPs by mints:', error);
    throw error;
  }
}
