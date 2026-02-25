
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CORS konfiguracija: dozvoljen samo Vercel domen
const ALLOWED_ORIGIN = "https://internet-tehnologije-2025-sistemzam.vercel.app";

function handleCors(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin === ALLOWED_ORIGIN) {
    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      // Preflight zahtevi
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
    return res;
  } else if (origin) {
    // Odbij sve ostale domene
    return new NextResponse("Forbidden", { status: 403 });
  }
  // Ako nema origin headera (npr. server-to-server), pusti dalje
  return null;
}

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
    const corsResult = handleCors(req);
    if (corsResult) return corsResult;
  }

  // Swagger UI stranica — bez restriktivnog CSP-a jer koristi inline stilove/skripte
  if (pathname.startsWith("/swagger") || pathname.startsWith("/api/swagger")) {
    const res = NextResponse.next();
    return res;
  }

  // 1) Za API rute (nakon CORS-a dodaj security header-e)
  if (pathname.startsWith("/api")) {
    const res = NextResponse.next();
    return addSecurityHeaders(res);
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