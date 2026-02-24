import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * @swagger
 * /api/korisnici:
 *   get:
 *     summary: Dohvati sve korisnike
 *     description: Vraća listu svih registrovanih korisnika. Pristup ima samo VLASNIK.
 *     tags: [Korisnici]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista korisnika
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 korisnici:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Korisnik'
 *       401:
 *         description: Niste prijavljeni
 *       403:
 *         description: Nemate pristup
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return addCorsHeaders(req, NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 }));
    }

    if ((user as any).uloga !== "VLASNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    const result = await query(
      `
      SELECT
        id_korisnik AS "id_korisnik",
        ime,
        prezime,
        email,
        uloga
      FROM korisnik
      ORDER BY id_korisnik DESC
      `
    );

    return addCorsHeaders(req, NextResponse.json({ korisnici: result.rows }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
