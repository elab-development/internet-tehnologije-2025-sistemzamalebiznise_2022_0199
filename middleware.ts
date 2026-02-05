import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Koristimo 'jose' jer standardni 'jsonwebtoken' ne radi u Edge Runtime-u

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Definišemo rute koje želimo da zaštitimo
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isOrdersPage = request.nextUrl.pathname.startsWith('/narudzbenice');

  if (isDashboardPage || isOrdersPage) {
    if (!token) {
      // Ako nema tokena, šaljemo ga na login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Proveravamo da li je token ispravan
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      
      return NextResponse.next();
    } catch (error) {
      // Ako je token nevažeći (istekao ili hakovan), šaljemo na login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Konfiguracija: Na koje rute se Middleware primenjuje
export const config = {
  matcher: ['/dashboard/:path*', '/narudzbenice/:path*'],
};