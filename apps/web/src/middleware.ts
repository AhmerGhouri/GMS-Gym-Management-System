import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic middleware to protect routes
// This will be expanded later with actual JWT token verification
export function middleware(request: NextRequest) {
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/forgot-password');
                     
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  // Skip middleware for API routes and static files
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Get token from cookies (we'll implement this in the auth store later)
  const hasToken = request.cookies.has('auth_token');

  if (!hasToken && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasToken && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
