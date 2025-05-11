import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Home page is accessible to everyone
  '/auth', // Auth pages need to be public
  '/api', // API routes have their own auth
  '/explorer', // Explorer page is public
];

// System paths that should never be intercepted
const SYSTEM_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
  '/fonts',
];

// Define protected routes that DO require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/poaps/create',
  '/poaps/edit', 
  '/profile',
  '/settings',
  // Add other protected routes here
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debugging log
  console.log(`[Middleware] Processing: ${pathname}`);
  
  // CRITICAL: Explicitly skip ALL explorer paths
  if (pathname === '/explorer' || pathname === '/explorer/' || pathname.startsWith('/explorer/')) {
    console.log(`[Middleware] SKIPPING explorer route: ${pathname}`);
    return NextResponse.next();
  }
  
  // Early return for system paths and files
  if (SYSTEM_PATHS.some(path => pathname.startsWith(path)) || pathname.includes('.')) {
    console.log(`[Middleware] Skipping system path: ${pathname}`);
    return NextResponse.next();
  }
  
  // Check if the route needs protection
  const needsAuth = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If the route doesn't need auth, allow access
  if (!needsAuth) {
    console.log(`[Middleware] Public route access allowed: ${pathname}`);
    return NextResponse.next();
  }
  
  // For all other routes, check if the user has a valid Solana auth token
  const token = request.cookies.get('solana_auth_token')?.value;
  
  // If no token, redirect to auth page with the current URL as the redirect target
  if (!token) {
    console.log(`[Middleware] No auth token for protected route, redirecting: ${pathname}`);
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

// Match only specific routes that need protection
export const config = {
  matcher: [
    // Protected paths
    '/dashboard',
    '/dashboard/:path*',
    '/poaps/create',
    '/poaps/create/:path*',
    '/poaps/edit',
    '/poaps/edit/:path*',
    '/profile',
    '/profile/:path*',
    '/settings',
    '/settings/:path*'
  ]
}; 