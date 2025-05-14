import { NextRequest, NextResponse } from 'next/server';

/**
 * Special middleware for Solana Pay endpoints
 * This intentionally bypasses authentication to allow public access
 */
export async function solanaPay(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    console.log('=== SOLANA PAY MIDDLEWARE ENTRY ===');
    console.log(`URL: ${req.nextUrl.pathname}`);
    console.log(`Method: ${req.method}`);
    console.log('Headers:', JSON.stringify(Object.fromEntries([...req.headers]), null, 2));
    
    // Always bypass authentication for Solana Pay endpoints
    console.log('Bypassing authentication for Solana Pay endpoint');
    
    // Call the handler
    try {
      const response = await handler(req);
      console.log(`Handler completed with status: ${response.status}`);
      
      // Add CORS headers to allow Solana wallets to access this endpoint
      const corsResponse = new NextResponse(response.body, response);
      corsResponse.headers.set('Access-Control-Allow-Origin', '*');
      corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      console.log('=== SOLANA PAY MIDDLEWARE EXIT ===');
      return corsResponse;
    } catch (handlerError) {
      console.error('Handler error:', handlerError);
      throw handlerError;
    }
  } catch (error) {
    console.error('=== SOLANA PAY MIDDLEWARE ERROR ===');
    console.error('Solana Pay middleware error:', error);
    
    // Create a CORS-enabled error response
    const errorResponse = NextResponse.json(
      {
        error: 'Solana Pay error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
    
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
} 