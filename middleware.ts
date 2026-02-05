import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose'; // Probaj ovaj način uvoza ako prethodni nije radio

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isOrdersPage = request.nextUrl.pathname.startsWith('/narudzbenice');

  if (isDashboardPage || isOrdersPage) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Proveravamo da li tajni ključ postoji
      const secretStr = process.env.JWT_SECRET;
      if (!secretStr) {
        throw new Error("JWT_SECRET nije definisan u .env fajlu");
      }

      const secret = new TextEncoder().encode(secretStr);
      
      // Verifikacija tokena
      await jose.jwtVerify(token, secret);
      
      return NextResponse.next();
    } catch (error) {
      console.error("Middleware error:", error);
      // Ako token ne valja, brišemo neispravan kolačić i šaljemo na login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/narudzbenice/:path*'],
};