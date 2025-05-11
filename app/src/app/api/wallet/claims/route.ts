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
      // Find claims for this wallet address
      const claims = await prisma.pOAPClaim.findMany({
        where: {
          walletAddress: walletAddress,
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

      // Format the response
      const formattedClaims = claims.map(claim => ({
        id: claim.id,
        poapId: claim.poapId,
        walletAddress: claim.walletAddress,
        mintAddress: claim.transactionSignature || '',
        createdAt: claim.createdAt,
        poap: claim.poap,
      }));

      return NextResponse.json({
        claims: formattedClaims,
        count: formattedClaims.length,
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
