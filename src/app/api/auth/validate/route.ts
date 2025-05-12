import { NextRequest, NextResponse } from 'next/server';
import { solanaAuthMiddleware } from '@/lib/solana-auth';

/**
 * Endpoint to validate a token without fetching additional data
 * Uses the solanaAuthMiddleware directly instead of the apiMiddleware
 * to ensure consistent validation with other endpoints
 */
export async function GET(req: NextRequest) {
  return solanaAuthMiddleware(req, async () => {
    // If middleware passes, token is valid
    return NextResponse.json({ 
      valid: true,
      wallet: (req as any).wallet?.address
    });
  });
} 