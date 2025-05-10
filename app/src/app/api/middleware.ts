import { NextRequest, NextResponse } from 'next/server';
import { solanaAuthMiddleware } from '@/lib/solana-auth';

// Middleware for handling API routes authentication
export async function apiMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip auth for public API endpoints
  const url = req.nextUrl.pathname;
  const publicRoutes = [
    '/api/auth',
    '/api/webhook',
  ];
  
  if (publicRoutes.some(route => url.startsWith(route))) {
    return handler(req);
  }
  
  // Apply Solana auth middleware for protected routes
  return solanaAuthMiddleware(req, () => handler(req));
} 