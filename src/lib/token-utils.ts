import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  mintTo,
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
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  if (!rpcUrl) {
    throw new Error('Solana RPC URL is not configured');
  }

  const connection = new Connection(rpcUrl, {
    commitment: 'confirmed',
  });

  try {
    const pubKey = new PublicKey(walletAddress);

    // Get Token2022 accounts specifically
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
      programId: TOKEN_2022_PROGRAM_ID,
    });

    if (!tokenAccounts || !tokenAccounts.value) {
      console.warn('No token accounts returned from RPC');
      return [];
    }

    console.log(
      `Found ${tokenAccounts.value.length} Token2022 accounts for wallet ${walletAddress.substring(0, 6)}...`
    );

    return tokenAccounts.value
      .map(account => {
        try {
          return {
            mint: account.account.data.parsed.info.mint,
            amount: account.account.data.parsed.info.tokenAmount.uiAmount,
            decimals: account.account.data.parsed.info.tokenAmount.decimals,
            isCompressed: true, // These are all Token2022 tokens
          };
        } catch (parseError) {
          console.error('Error parsing token account:', parseError);
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Error fetching Token2022 accounts:', error);
    // Add more detailed error info to help debugging
    const errorMessage =
      error instanceof Error ? `${error.message} (${error.name})` : 'Unknown error format';

    throw new Error(`Failed to fetch token accounts: ${errorMessage}`);
  }
}

// Get POP tokens from database by mint addresses
export async function getPOPsByMints(mintAddresses: string[]) {
  if (!mintAddresses.length) return [];

  try {
    // First get the POP tokens with these mint addresses
    const popTokens = await prisma.popToken.findMany({
      where: {
        mintAddress: {
          in: mintAddresses,
        },
      },
      include: {
        pop: true,
      },
    });

    // Then get the claims associated with these POPs
    const popIds = popTokens.map(token => token.popId);
    const claims = await prisma.pOPClaim.findMany({
      where: {
        popId: {
          in: popIds,
        },
      },
      select: {
        popId: true,
        walletAddress: true,
        transactionSignature: true,
        createdAt: true,
      },
    });

    // Associate the claims with their POPs
    return popTokens.map(token => ({
      ...token.pop,
      mintAddress: token.mintAddress,
      claims: claims.filter(claim => claim.popId === token.popId),
    }));
  } catch (error) {
    console.error('Error fetching POPs by mints:', error);
    throw error;
  }
}

/**
 * Utility function to check if a token has been minted for a POP
 * Can be used in both client and server contexts
 * @param popId The ID of the POP to check for token minting
 * @param options Optional configuration for the API call
 * @returns Object indicating if the token is minted and its mint address if available
 */
export async function checkTokenMinted(
  popId: string,
  options: {
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    endpoint?: 'pop' | 'token/status';
  } = {}
): Promise<{ minted: boolean; mintAddress?: string; error?: string }> {
  try {
    // Default to the POP endpoint, allow option for token/status endpoint
    const endpoint = options.endpoint === 'token/status' ? 'token/status' : '';
    
    // Prepare headers with caching prevention if checking token status
    const headers: HeadersInit = {
      ...(options.endpoint === 'token/status' ? {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
        'If-None-Match': Math.random().toString(), // Prevent caching
      } : {}),
      ...(options.headers || {})
    };

    // Make the API call
    const response = await fetch(`/api/pops/${popId}/${endpoint}`, {
      method: 'GET',
      headers,
      credentials: options.credentials || 'include',
    });

    // Handle specific status codes
    if (response.status === 404) {
      console.warn(
        `Token status endpoint not found for POP ${popId}. This might be expected if the endpoint is still being deployed.`
      );
      return { minted: false, error: 'endpoint-not-found' };
    }

    if (!response.ok) {
      console.error(
        `Error response from token status check: ${response.status} ${response.statusText}`
      );
      return { minted: false, error: 'server-error' };
    }

    const data = await response.json();
    
    // Different endpoints return different data structures
    if (options.endpoint === 'token/status') {
      // Token status API returns minted flag directly
      if (data && typeof data.minted === 'boolean') {
        return { minted: data.minted, mintAddress: data.mintAddress };
      } else {
        console.warn(`Unexpected token status response format for POP ${popId}:`, data);
        return { minted: false, error: 'invalid-response' };
      }
    } else {
      // POP API returns token object in pop.token
      return {
        minted: !!data.pop?.token,
        mintAddress: data.pop?.token?.mintAddress,
      };
    }
  } catch (error) {
    console.error('Error checking token mint status:', error);
    return { minted: false, error: 'network-error' };
  }
}
