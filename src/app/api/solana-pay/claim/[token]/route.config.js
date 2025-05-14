/**
 * Next.js route configuration
 * This explicitly marks the Solana Pay routes as public without authentication
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// No authentication required for this route
export const auth = false; 