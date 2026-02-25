import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const DOZVOLJENE_ULOGE = ["VLASNIK", "RADNIK", "DOSTAVLJAC"];

/**
 * @swagger
 * /api/korisnici/{id}:
 *   patch:
 *     summary: Promeni ulogu korisnika
 *     description: Menja ulogu korisniku. Samo VLASNIK ima pristup. Ne možete promeniti sopstvenu ulogu.
 *     tags: [Korisnici]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID korisnika
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [uloga]
 *             properties:
 *               uloga:
 *                 type: string
 *                 enum: [VLASNIK, RADNIK, DOSTAVLJAC]
 *                 example: RADNIK
 *     responses:
 *       200:
 *         description: Uloga uspešno promenjena
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 korisnik:
 *                   $ref: '#/components/schemas/Korisnik'
 *       400:
 *         description: Neispravan ID, uloga obavezna, neispravna uloga, ili pokušaj menjanja sopstvene uloge
 *       401:
 *         description: Niste prijavljeni
 *       403:
 *         description: Nemate pristup
 *       404:
 *         description: Korisnik ne postoji
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    //proveriti
    const authUser = await requireAuth(req);

    if (!authUser) {
      return addCorsHeaders(req, NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 }));
    }

    if ((authUser as any).uloga !== "VLASNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    const { id } = await ctx.params; 
    const idStr = String(id ?? "").trim();

    if (!/^\d+$/.test(idStr)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravan ID" }, { status: 400 }));
    }
    const korisnikId = Number(idStr);

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Neispravan JSON body (pošalji npr. {\"uloga\":\"RADNIK\"})" },
        { status: 400 }
      ));
    }

    const uloga = String(body?.uloga ?? "").trim();

    if (!uloga) {
      return addCorsHeaders(req, NextResponse.json({ error: "Uloga je obavezna" }, { status: 400 }));
    }

    if (!DOZVOLJENE_ULOGE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravna uloga" }, { status: 400 }));
    }

    const authId = Number((authUser as any).userId);
    if (korisnikId === authId) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Ne možete promeniti sopstvenu ulogu" },
        { status: 400 }
      ));
    }

    const result = await query(
      `
      UPDATE korisnik
      SET uloga = $1
      WHERE id_korisnik = $2
      RETURNING id_korisnik AS "id_korisnik", ime, prezime, email, uloga
      `,
      [uloga, korisnikId]
    );

    if (result.rowCount === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: "Korisnik ne postoji" }, { status: 404 }));
    }

    return addCorsHeaders(req, NextResponse.json({ korisnik: result.rows[0] }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
