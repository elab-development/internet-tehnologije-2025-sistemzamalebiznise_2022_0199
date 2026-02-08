import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Routes that should be protected
  const protectedRoutes = [
    '/dashboard',
    '/narudzbenice',
    '/proizvodi',
    '/dobavljaci',
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Allow public routes
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'kljuc_za_jwt_token');
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/narudzbenice/:path*', '/proizvodi/:path*', '/dobavljaci/:path*'],
};