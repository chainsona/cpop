import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    // Verify user is authenticated
    const authResult = await verifyAuth(request);

    if (!authResult.isAuthenticated || !authResult.walletAddress) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get wallet address from authenticated user
    const walletAddress = authResult.walletAddress;
    const { id: poapId } = await params;

    // Directly query the database for claim status
    const claimRecord = await prisma.pOAPClaim.findUnique({
      where: {
        poapId_walletAddress: {
          poapId,
          walletAddress,
        },
      },
    });

    if (!claimRecord) {
      return NextResponse.json({
        hasClaimed: false,
      });
    }

    return NextResponse.json({
      hasClaimed: true,
      claimTimestamp: claimRecord.createdAt.toISOString(),
      claimTxId: claimRecord.transactionSignature || undefined,
      claimId: claimRecord.id,
    });
  } catch (error) {
    console.error('Error checking claim status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
