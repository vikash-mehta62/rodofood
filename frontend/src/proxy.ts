import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes — no auth needed
const PUBLIC_PATHS = ['/landing', '/login', '/restaurant-register', '/'];

// Auth-only routes (redirect away if already logged in)
const AUTH_ONLY = ['/login'];

// Protected route prefixes
const PROTECTED_PREFIXES = [
  '/home', '/trip', '/cart', '/orders', '/profile',
  '/restaurant/dashboard', '/restaurant/menu', '/restaurant/orders', '/restaurant/profile', '/restaurant/coupons',
  '/admin',
];

function getUser(request: NextRequest): { role?: string } | null {
  // Try rf_auth cookie (set by authStore)
  const authCookie = request.cookies.get('rf_auth')?.value;
  if (authCookie) {
    try {
      const decoded = decodeURIComponent(authCookie);
      const parsed = JSON.parse(decoded);
      const user = parsed?.state?.user ?? null;
      if (user?.role) return user;
    } catch { /* ignore */ }
  }

  // Try rf_token cookie (set separately as fallback)
  const tokenCookie = request.cookies.get('rf_token')?.value;
  if (tokenCookie) {
    // Token exists = logged in, but we don't know role from token alone
    // Allow access and let client-side handle role routing
    return { role: 'unknown' };
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  const user = getUser(request);
  const isLoggedIn = !!user;
  const role = user?.role;

  // Already logged in → redirect away from login page
  if (isLoggedIn && AUTH_ONLY.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (role === 'restaurant') return NextResponse.redirect(new URL('/restaurant/dashboard', request.url));
    // unknown role or customer
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Not logged in → redirect to login for protected routes
  const isProtected = PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based: non-admin trying to access /admin
  if (isLoggedIn && role !== 'unknown' && pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Role-based: non-restaurant trying to access restaurant panel
  if (isLoggedIn && role !== 'unknown' && (
    pathname.startsWith('/restaurant/dashboard') ||
    pathname.startsWith('/restaurant/menu') ||
    pathname.startsWith('/restaurant/orders') ||
    pathname.startsWith('/restaurant/coupons') ||
    pathname.startsWith('/restaurant/profile')
  ) && role !== 'restaurant') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-192.png|manifest.json).*)',
  ],
};
