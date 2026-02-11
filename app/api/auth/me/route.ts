import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return addCorsHeaders(req, NextResponse.json({ error: "Niste ulogovani" }, { status: 401 }));
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "kljuc_za_jwt_token"
    );

    const { payload } = await jose.jwtVerify(token, secret);

    return addCorsHeaders(req, NextResponse.json({ user: payload }, { status: 200 }));
  } catch (error) {
    return addCorsHeaders(req, NextResponse.json({ error: "Nevalidan token" }, { status: 401 }));
  }
}

