import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * API endpoint to check and refresh authentication token
 */
export async function GET(request: NextRequest) {
  try {
    // Check the current auth state
    const auth = await verifyAuth(request);
    const walletAddress = auth.walletAddress;
    
    return NextResponse.json({
      isAuthenticated: auth.isAuthenticated,
      walletAddress: walletAddress || null,
      message: auth.isAuthenticated
        ? 'Authentication valid'
        : 'Not authenticated or token expired',
    });
  } catch (error) {
    console.error('Auth refresh error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check authentication',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to forcefully set a cookie for testing
 */
export async function POST(request: NextRequest) {
  try {
    const { token, walletAddress } = await request.json();

    if (!token || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing token or wallet address' },
        { status: 400 }
      );
    }

    // Create a response with the authentication cookie
    const response = NextResponse.json({
      success: true,
      message: 'Auth cookie set for testing',
      walletAddress,
    });

    // Set the cookie
    response.cookies.set('solana_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Set auth cookie error:', error);
    return NextResponse.json(
      {
        error: 'Failed to set auth cookie',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 