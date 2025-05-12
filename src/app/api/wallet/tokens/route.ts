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
      // First, get all available POP mint addresses from the database
      const allPopTokens = await prisma.popToken.findMany({
        select: {
          mintAddress: true,
          id: true,
          popId: true,
          pop: {
            select: {
              title: true,
              description: true,
              imageUrl: true,
            },
          },
        },
      });

      if (!allPopTokens || allPopTokens.length === 0) {
        return NextResponse.json({
          tokens: [],
          count: 0,
          message: 'No POP tokens found in the database',
        });
      }

      console.log(`Found ${allPopTokens.length} POP tokens in database`);
      const popMintAddresses = allPopTokens.map(token => token.mintAddress);

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

      // Find the intersection of wallet tokens and POP tokens
      const matchingMintAddresses = walletMintAddresses.filter(mintAddress =>
        popMintAddresses.includes(mintAddress)
      );

      console.log(`Found ${matchingMintAddresses.length} matches between wallet and database`);

      if (matchingMintAddresses.length === 0) {
        console.log('No matching POP tokens found in wallet');
        return NextResponse.json({
          tokens: [],
          count: 0,
          message: 'No POP tokens found in wallet',
        });
      }

      // Format the results for the API response
      const popTokenResults = matchingMintAddresses
        .map(mintAddress => {
          const walletToken = validWalletTokens.find(t => t.mint === mintAddress);
          const popToken = allPopTokens.find(p => p.mintAddress === mintAddress);

          if (!walletToken || !popToken || !popToken.pop) {
            return null; // Should never happen
          }

          return {
            id: popToken.id,
            popId: popToken.popId,
            title: popToken.pop.title,
            description: popToken.pop.description,
            imageUrl: popToken.pop.imageUrl,
            amount: walletToken.amount,
            mintAddress: mintAddress,
            isCompressed: walletToken.isCompressed,
            createdAt: new Date().toISOString(), // We don't have this from the blockchain
            source: 'database',
          };
        })
        .filter(Boolean);

      // Return only the POP tokens found in wallet
      return NextResponse.json({
        tokens: popTokenResults,
        count: popTokenResults.length,
        message: 'Successfully matched Token2022 tokens with POP database records',
      });
    } catch (error) {
      console.error('Error querying database or blockchain:', error);
      return NextResponse.json(
        { 
          message: 'Failed to fetch POP tokens', 
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
