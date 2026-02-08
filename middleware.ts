import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JAVNE_RUTE = ["/", "/registracija"]; // stranice koje smeju bez logina

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // pusti Next statiku
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // pusti auth API rute
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // pusti javne stranice
  if (JAVNE_RUTE.includes(pathname)) {
    return NextResponse.next();
  }

  // sve ostalo zahteva token cookie
  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/"; // početna = login
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)", "/api/:path*"],
};
