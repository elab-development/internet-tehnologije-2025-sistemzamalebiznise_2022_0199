import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://172.20.10.4:8080",
  "http://172.20.10.4:3000",
  "https://shop-scale-buddy.lovable.app",
];

export function addCorsHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
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

export function handleOptions(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return addCorsHeaders(req, res);
}