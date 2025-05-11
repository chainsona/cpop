import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { apiMiddleware } from '../../../middleware';

type Params = Promise<{
  id: string;
}>;

// GET endpoint to fetch token information for a POAP
async function getTokenHandler(req: NextRequest, { params }: { params: Params }) {
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
        settings: true,
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

    // Check if the user is authorized:
    // 1. If using NextAuth, check if the user is the creator by ID
    // 2. If using wallet auth, check if the wallet address matches the creator's wallet
    const isAuthorized =
      (session?.user?.id && poap.creatorId === session.user.id) ||
      (walletAddress && poap.creator?.walletAddress === walletAddress);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You do not have permission to access this POAP token information' },
        { status: 403 }
      );
    }

    // Get token information
    const token = await prisma.poapToken.findFirst({
      where: { poapId },
    });

    // Instead of using the claim count directly, use distribution methods
    // to get a estimate of claimed tokens or a placeholder for now
    const claimedCount = 0; // This will need to be updated based on the actual schema

    // Calculate available/unclaimed tokens - no longer based on supply
    const availableSupply = 0; // We don't track supply in PoapToken model anymore

    // Return token information
    return NextResponse.json({
      token: token
        ? {
            ...token,
            claimed: claimedCount,
            available: availableSupply,
          }
        : null,
      tokenMinted: !!token,
      poap: {
        id: poap.id,
        title: poap.title,
        description: poap.description,
        imageUrl: poap.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching token information:', error);
    return NextResponse.json({ error: 'Failed to fetch token information' }, { status: 500 });
  }
}

// Export the handler wrapped with auth middleware
export const GET = (req: NextRequest, ctx: { params: Params }) =>
  apiMiddleware(req, async () => getTokenHandler(req, ctx));
