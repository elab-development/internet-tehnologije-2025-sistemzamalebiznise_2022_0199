import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://172.20.10.4:8080",
  "http://172.20.10.4:8081",
  "http://172.20.10.4:3000",
  "http://172.17.240.1:3000",
  "http://172.17.240.1:8080",
  "http://172.17.240.1:8081",
  "https://shop-scale-buddy.lovable.app",
  // Dodato za produkciju:
  "https://internet-tehnologije-2025-9nvi.onrender.com",
  "https://internet-tehnologije-2025-sistemzam.vercel.app/login",
  "https://internet-tehnologije-2025-sistemzamalebiznise-2022-0-5gi4kmeq3.vercel.app",
];

export function addCorsHeaders(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = (origin: string | null) => {
    if (!origin) return false;
    return ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app");
  };
  if (origin && isAllowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}

export function handleOptions(req: NextRequest): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  return addCorsHeaders(req, res);
}