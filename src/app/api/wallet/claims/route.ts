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

    // Get pagination parameters from query
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    try {
      // Use Promise.all to run queries in parallel for better performance
      const [totalCount, claims] = await Promise.all([
        // Count query - just get the total
        prisma.pOPClaim.count({
          where: {
            walletAddress: walletAddress,
          },
        }),
        
        // Optimized data query with pagination
        prisma.pOPClaim.findMany({
          where: {
            walletAddress: walletAddress,
          },
          include: {
            pop: {
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
          skip,
          take: limit,
        }),
      ]);

      // Format the response
      const formattedClaims = claims.map(claim => ({
        id: claim.id,
        popId: claim.popId,
        walletAddress: claim.walletAddress,
        mintAddress: claim.transactionSignature || '',
        createdAt: claim.createdAt,
        pop: claim.pop,
      }));

      return NextResponse.json({
        claims: formattedClaims,
        count: formattedClaims.length,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        }
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
