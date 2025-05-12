import { NextRequest, NextResponse } from 'next/server';
import { solanaAuthMiddleware } from '@/lib/solana-auth';

// Middleware for handling API routes authentication
export async function apiMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Skip auth for public API endpoints
    const url = req.nextUrl.pathname;

    const publicRoutes = [
      '/api/auth',
      '/api/webhook',
      '/api/pops/[id]/public',
      '/api/pops/[id]/attributes/public',
      '/api/pops/public',
      '/api/test',
    ];

    console.log('POST request received for POP:', url);

    // Only allow explicitly marked public routes without authentication
    if (publicRoutes.some(route => url.includes(route.replace('[id]', '')))) {
      return handler(req);
    }

    // Apply Solana auth middleware for protected routes
    return solanaAuthMiddleware(req, () => handler(req));
  } catch (error) {
    console.error('API middleware error:', error);
    return NextResponse.json(
      {
        error: 'Authentication error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
