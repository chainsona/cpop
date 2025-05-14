import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle OPTIONS requests for CORS preflight at the root level
 */
export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight
  const response = new NextResponse(null, { status: 204 });
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  console.log('[Solana Pay Root] Handling OPTIONS request');
  return response;
}

// For direct requests to the Solana Pay root
export async function GET() {
  return NextResponse.json(
    { status: "Solana Pay API available" },
    { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
} 