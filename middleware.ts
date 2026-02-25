import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addCorsHeaders, handleOptions } from "./lib/cors";

/**
 * Security middleware:
 * - XSS zaštita putem HTTP security headera
 * - Zaštita page ruta (redirect na login ako nema tokena)
 *
 * Napomena: SQL Injection zaštita je u lib/db.ts (parametrizovani upiti),
 * CORS zaštita je u lib/cors.ts (origin whitelist).
 */

function addSecurityHeaders(res: NextResponse): NextResponse {
  // Sprečava MIME-type sniffing (XSS vektor)
  res.headers.set("X-Content-Type-Options", "nosniff");
  // Sprečava clickjacking (iframe embedding)
  res.headers.set("X-Frame-Options", "DENY");
  // Legacy XSS filter za starije browsere
  res.headers.set("X-XSS-Protection", "1; mode=block");
  // Kontroliše šta se šalje u Referer headeru
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Ograničava dozvoljena izvršavanja resursa (CSP)
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* ws://localhost:*"
  );
  // Zabranjuje pristup kamera, mikrofonu, geolokaciji
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CORS na samom početku za API rute
  if (pathname.startsWith("/api")) {
    // Preflight OPTIONS zahtevi
    if (req.method === "OPTIONS") {
      return handleOptions(req);
    }
    // Dodaj CORS header-e za sve ostale API zahteve
    const res = NextResponse.next();
    return addCorsHeaders(req, res);
  }

  // Swagger UI stranica — bez restriktivnog CSP-a jer koristi inline stilove/skripte
  if (pathname.startsWith("/swagger") || pathname.startsWith("/api/swagger")) {
    const res = NextResponse.next();
    return res;
  }

  // 2) Štiti page rute
  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

// Ograniči match na page rute
export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};