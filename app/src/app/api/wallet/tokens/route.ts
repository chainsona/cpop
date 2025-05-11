import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils';
import { getTokensForWallet } from '@/lib/token-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get authentication token from cookies
    const token = request.cookies.get('solana_auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get wallet address from token
    const auth = await getAuthToken(token);

    if (!auth || !auth.walletAddress) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const walletAddress = auth.walletAddress;
    console.log(`Fetching tokens for wallet: ${walletAddress.substring(0, 8)}...`);

    try {
      // First, get all available POAP mint addresses from the database
      const allPoapTokens = await prisma.poapToken.findMany({
        select: {
          mintAddress: true,
          id: true,
          poapId: true,
          poap: {
            select: {
              title: true,
              description: true,
              imageUrl: true,
            },
          },
        },
      });

      if (!allPoapTokens || allPoapTokens.length === 0) {
        return NextResponse.json({
          tokens: [],
          count: 0,
          message: 'No POAP tokens found in the database',
        });
      }

      console.log(`Found ${allPoapTokens.length} POAP tokens in database`);
      const poapMintAddresses = allPoapTokens.map(token => token.mintAddress);

      // Fetch compressed Token2022 tokens from blockchain
      const walletTokens = await getTokensForWallet(walletAddress);
      
      // Filter out any null tokens from the result
      const validWalletTokens = walletTokens.filter(token => token !== null);

      console.log(
        `Found ${validWalletTokens.length} Token2022 tokens in blockchain wallet:`,
        validWalletTokens.map(t => ({ mint: t.mint, amount: t.amount }))
      );

      // Get the mint addresses from wallet
      const walletMintAddresses = validWalletTokens.map(token => token.mint);

      // Find the intersection of wallet tokens and POAP tokens
      const matchingMintAddresses = walletMintAddresses.filter(mintAddress =>
        poapMintAddresses.includes(mintAddress)
      );

      console.log(`Found ${matchingMintAddresses.length} matches between wallet and database`);

      if (matchingMintAddresses.length === 0) {
        console.log('No matching POAP tokens found in wallet');
        return NextResponse.json({
          tokens: [],
          count: 0,
          message: 'No POAP tokens found in wallet',
        });
      }

      // Format the results for the API response
      const poapTokenResults = matchingMintAddresses
        .map(mintAddress => {
          const walletToken = validWalletTokens.find(t => t.mint === mintAddress);
          const poapToken = allPoapTokens.find(p => p.mintAddress === mintAddress);

          if (!walletToken || !poapToken || !poapToken.poap) {
            return null; // Should never happen
          }

          return {
            id: poapToken.id,
            poapId: poapToken.poapId,
            title: poapToken.poap.title,
            description: poapToken.poap.description,
            imageUrl: poapToken.poap.imageUrl,
            amount: walletToken.amount,
            mintAddress: mintAddress,
            isCompressed: walletToken.isCompressed,
            createdAt: new Date().toISOString(), // We don't have this from the blockchain
            source: 'database',
          };
        })
        .filter(Boolean);

      // Return only the POAP tokens found in wallet
      return NextResponse.json({
        tokens: poapTokenResults,
        count: poapTokenResults.length,
        message: 'Successfully matched Token2022 tokens with POAP database records',
      });
    } catch (error) {
      console.error('Error querying database or blockchain:', error);
      return NextResponse.json(
        { 
          message: 'Failed to fetch POAP tokens', 
          error: String(error),
          details: error instanceof Error ? error.stack : undefined 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: String(error),
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
