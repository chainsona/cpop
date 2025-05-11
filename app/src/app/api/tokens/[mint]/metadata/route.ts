import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { prisma } from '@/lib/prisma';

// Define a type for the claim result including poap
type ClaimWithPoap = {
  id: string;
  poapId: string;
  walletAddress: string;
  mintAddress?: string;
  transactionSignature?: string;
  createdAt: Date;
  poap?: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
  };
};

// Try to fetch token metadata from Solana blockchain
async function fetchBlockchainMetadata(connection: Connection, mintAddress: string) {
  try {
    const mintPubkey = new PublicKey(mintAddress);

    // Check if account exists
    const accountInfo = await connection.getAccountInfo(mintPubkey);
    if (!accountInfo) {
      return null;
    }

    // In a real implementation, you would:
    // 1. Derive the token metadata PDA using metaplex standards
    // 2. Fetch the metadata account
    // 3. Parse the on-chain data
    // 4. Fetch off-chain data from URI if available

    // Here we're just returning mock data for demonstration
    return {
      name: `POAP ${mintAddress.substring(0, 6)}...${mintAddress.substring(mintAddress.length - 4)}`,
      description: 'POAP Token stored on Solana blockchain',
      image: '/blockchain-poap.svg',
      mint: mintAddress,
      symbol: 'POAP',
      source: 'blockchain',
    };
  } catch (error) {
    console.error('Error fetching blockchain metadata:', error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ mint: string }> }) {
  try {
    const { mint } = await params;

    // Validate mint address
    try {
      new PublicKey(mint);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid mint address' }, { status: 400 });
    }

    // Create connection to Solana
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
    );

    // Try to get metadata from blockchain first
    const blockchainMetadata = await fetchBlockchainMetadata(connection, mint);
    if (blockchainMetadata) {
      return NextResponse.json(blockchainMetadata);
    }

    // If not in blockchain, check if we have this token in our database
    try {
      // Look for the token in the poapToken model
      const poapToken = await prisma.poapToken.findFirst({
        where: {
          mintAddress: mint,
        },
        include: {
          poap: true,
        },
      });

      if (poapToken && poapToken.poap) {
        return NextResponse.json({
          name: poapToken.poap.title,
          description: poapToken.poap.description,
          image: poapToken.poap.imageUrl,
          mint,
          source: 'database',
        });
      }
    } catch (dbError) {
      console.error('Error fetching from database:', dbError);
    }

    // If we couldn't find metadata anywhere, return a generic response
    return NextResponse.json({
      name: `Token ${mint.substring(0, 6)}...${mint.substring(mint.length - 4)}`,
      description: 'Unknown token',
      image: '/placeholder-token.svg',
      mint,
      source: 'unknown',
    });
  } catch (error) {
    console.error('Error in token metadata endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
