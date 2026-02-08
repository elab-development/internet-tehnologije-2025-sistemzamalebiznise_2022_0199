import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Nikad ne diraj API rute (API same rade requireAuth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2) (Opcionalno) štiti samo neke page rute
  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Ograniči match na page rute (API preskačemo gore, ali bolje i ovde)
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};