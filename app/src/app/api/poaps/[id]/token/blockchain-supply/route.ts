import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '@/app/api/middleware';
import { PublicKey, Keypair } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { createRpc } from '@lightprotocol/stateless.js';
import bs58 from 'bs58';

const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || '';

type Params = Promise<{
  id: string;
}>;

// GET endpoint to fetch token supply from blockchain for a POAP
async function getTokenBlockchainSupplyHandler(req: NextRequest, { params }: { params: Params }) {
  try {
    // Check for Solana wallet auth first
    const walletAddress = (req as any).wallet?.address;

    // Try NextAuth session as fallback
    const session = await getServerSession(authOptions);

    // If neither authentication method worked, return unauthorized
    if (!walletAddress && (!session || !session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: poapId } = await params;

    // Get POAP details to check ownership
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

    // Check if the user is authorized
    const isAuthorized =
      (session?.user?.id && poap.creatorId === session.user.id) ||
      (walletAddress && poap.creator?.walletAddress === walletAddress);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to access this POAP token information' },
        { status: 403 }
      );
    }

    // Get token information from database
    const token = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    if (!token || !token.mintAddress) {
      return NextResponse.json({ error: 'Token not found for this POAP' }, { status: 404 });
    }

    if (!RPC_ENDPOINT) {
      return NextResponse.json({ error: 'Solana RPC endpoint not configured' }, { status: 500 });
    }

    try {
      // Create RPC connection
      const connection = createRpc(RPC_ENDPOINT);

      // Get mint public key
      const mintPublicKey = new PublicKey(token.mintAddress);

      // Check if TOKEN_MINT_AUTHORITY_SECRET env var exists
      if (!process.env.TOKEN_MINT_AUTHORITY_SECRET) {
        console.error('TOKEN_MINT_AUTHORITY_SECRET environment variable is not configured');
        return NextResponse.json({ 
          error: 'Missing TOKEN_MINT_AUTHORITY_SECRET environment variable' 
        }, { status: 500 });
      }

      // Get the mint authority keypair from the secret key
      const mintAuthority = Keypair.fromSecretKey(bs58.decode(process.env.TOKEN_MINT_AUTHORITY_SECRET));
      const mintAuthorityPublicKey = mintAuthority.publicKey;
      console.log(`Using mint authority public key: ${mintAuthorityPublicKey.toBase58()}`);

      // Get token account for the mint authority
      let totalSupply = 0; // We don't track supply in the PoapToken model anymore
      let authorityBalance = 0;

      try {
        // Log connection attempt
        console.log(`Attempting to get token accounts for authority ${mintAuthorityPublicKey.toBase58().slice(0, 8)}... and mint ${mintPublicKey.toBase58().slice(0, 8)}...`);
        
        // Get the authority's token account address
        const authorityAtaInfo = await connection.getTokenAccountsByOwner(
          mintAuthorityPublicKey,
          { mint: mintPublicKey, programId: TOKEN_2022_PROGRAM_ID }
        );

        console.log(`Found ${authorityAtaInfo.value.length} token account(s) for authority`);

        if (authorityAtaInfo.value.length > 0) {
          const authorityAta = authorityAtaInfo.value[0].pubkey;
          console.log(`Getting account info for authority ATA: ${authorityAta.toBase58().slice(0, 8)}...`);
          
          const accountInfo = await getAccount(
            connection,
            authorityAta,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );
          authorityBalance = Number(accountInfo.amount);
          console.log(`Authority token balance: ${authorityBalance}`);
        } else {
          console.log('No token accounts found for authority - assuming zero balance');
        }
      } catch (error) {
        console.error('Error fetching authority token account:', error);
        // Continue with the default values if there's an error
      }

      // Calculate distributed tokens (total supply - authority balance)
      const distributedTokens = totalSupply - authorityBalance;
      console.log(`Calculated token distribution: Total=${totalSupply}, Authority=${authorityBalance}, Distributed=${distributedTokens}`);

      return NextResponse.json({
        tokenSupply: totalSupply,
        authorityBalance: authorityBalance,
        distributedTokens: distributedTokens
      });
    } catch (error) {
      console.error('Error fetching blockchain token data:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch blockchain token data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in blockchain token supply handler:', error);
    return NextResponse.json({ error: 'Failed to fetch token information' }, { status: 500 });
  }
}

// Export the handler wrapped with auth middleware
export const GET = (req: NextRequest, ctx: { params: Params }) =>
  apiMiddleware(req, async () => getTokenBlockchainSupplyHandler(req, ctx));