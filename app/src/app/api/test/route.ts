import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const walletAddress = (request as any).wallet?.address;
  
  return NextResponse.json({
    authenticated: !!session || !!walletAddress,
    session: session ? {
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
      }
    } : null,
    wallet: walletAddress ? { address: walletAddress } : null,
  });
} 