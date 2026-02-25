import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Dohvati podatke ulogovanog korisnika
 *     description: Vraća podatke iz JWT tokena za trenutno ulogovanog korisnika.
 *     tags: [Autentifikacija]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Podaci ulogovanog korisnika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     uloga:
 *                       type: string
 *                       enum: [VLASNIK, RADNIK, DOSTAVLJAC]
 *       401:
 *         description: Niste ulogovani ili nevalidan token
 */
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
  } catch (_) {
    return addCorsHeaders(req, NextResponse.json({ error: "Nevalidan token" }, { status: 401 }));
  }
}

