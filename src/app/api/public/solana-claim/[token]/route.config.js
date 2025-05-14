/**
 * Next.js route configuration for the public Solana Pay claim endpoint
 * This explicitly marks the route as public without authentication
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// No authentication required for this route
export const auth = false; 