import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils';
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
    console.log(`Fetching claims for wallet: ${walletAddress.substring(0, 8)}...`);

    try {
      // Find the user first to get their ID
      const user = await prisma.user.findUnique({
        where: {
          walletAddress: walletAddress,
        },
      });

      if (!user) {
        console.log(`No user found for wallet address: ${walletAddress}`);
        return NextResponse.json({
          claims: [],
          count: 0,
        });
      }

      // Use poapToken model to get tokens owned by this user
      const poapTokens = await prisma.poapToken.findMany({
        where: {
          ownerId: user.id,
        },
        include: {
          poap: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format tokens as claims to maintain API compatibility
      const claims = poapTokens.map(token => ({
        id: token.id,
        poapId: token.poapId,
        walletAddress: walletAddress,
        mintAddress: token.mintAddress,
        createdAt: token.createdAt,
        poap: token.poap,
      }));

      return NextResponse.json({
        claims,
        count: claims.length,
      });
    } catch (error) {
      console.error('Error fetching wallet claims:', error);
      return NextResponse.json(
        { message: 'Failed to fetch claims', error: String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in claims endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
