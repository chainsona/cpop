import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    console.log('Received claim status request for POP:', await params.then(p => p.id));
    
    // Log request headers
    console.log('Request headers:', {
      auth: request.headers.get('Authorization')?.substring(0, 15) + '...' || 'none',
      hasCookies: !!request.headers.get('Cookie'),
      contentType: request.headers.get('Content-Type'),
    });
    
    // Verify user is authenticated
    const authResult = await verifyAuth(request);
    console.log('Auth verification result:', {
      isAuthenticated: authResult.isAuthenticated,
      hasWalletAddress: !!authResult.walletAddress,
    });

    if (!authResult.isAuthenticated || !authResult.walletAddress) {
      return NextResponse.json({ message: 'Authentication required' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Get wallet address from authenticated user
    const walletAddress = authResult.walletAddress;
    const { id: popId } = await params;

    // Directly query the database for claim status
    const claimRecord = await prisma.pOPClaim.findUnique({
      where: {
        popId_walletAddress: {
          popId,
          walletAddress,
        },
      },
    });

    if (!claimRecord) {
      return NextResponse.json({
        hasClaimed: false,
      }, {
        headers: {
          'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    return NextResponse.json({
      hasClaimed: true,
      claimTimestamp: claimRecord.createdAt.toISOString(),
      claimTxId: claimRecord.transactionSignature || undefined,
      claimId: claimRecord.id,
    }, {
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    console.error('Error checking claim status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}
