import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Home page is accessible to everyone
  '/auth', // Auth pages need to be public
  '/api', // API routes have their own auth
];

// System paths that should never be intercepted
const SYSTEM_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
  '/fonts',
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for system paths and files
  if (
    SYSTEM_PATHS.some(path => pathname.startsWith(path)) ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || 
    (route !== '/' && pathname.startsWith(`${route}/`))
  );
  
  // Allow access to public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For all other routes, check if the user has a valid Solana auth token
  const token = request.cookies.get('solana_auth_token')?.value;
  
  // If no token, redirect to auth page with the current URL as the redirect target
  if (!token) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Check for wallet address change flag (set by the API middleware)
  const walletChanged = request.cookies.get('wallet_address_changed')?.value;
  if (walletChanged === 'true') {
    // Clear the wallet_address_changed cookie
    const response = NextResponse.redirect(new URL('/auth', request.url));
    response.cookies.set('wallet_address_changed', '', { 
      maxAge: 0,
      path: '/',
    });
    
    // Clear the Solana auth token as well
    response.cookies.set('solana_auth_token', '', {
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
  
  // If token exists and no wallet change detected, allow access to the protected route
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 