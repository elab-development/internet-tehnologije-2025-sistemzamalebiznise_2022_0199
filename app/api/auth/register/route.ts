import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const DOZVOLJENE_ULOGE = ["VLASNIK", "RADNIK", "DOSTAVLJAC"] as const;

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registracija novog korisnika
 *     description: Registruje novog korisnika u sistem. Lozinka mora imati najmanje 6 karaktera.
 *     tags: [Autentifikacija]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ime, prezime, email, lozinka, uloga]
 *             properties:
 *               ime:
 *                 type: string
 *                 example: Marko
 *               prezime:
 *                 type: string
 *                 example: Marković
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marko@example.com
 *               lozinka:
 *                 type: string
 *                 minLength: 6
 *                 example: lozinka123
 *               uloga:
 *                 type: string
 *                 enum: [VLASNIK, RADNIK, DOSTAVLJAC]
 *                 example: RADNIK
 *     responses:
 *       201:
 *         description: Korisnik uspešno registrovan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Korisnik'
 *       400:
 *         description: Validaciona greška
 *       409:
 *         description: Email je već u upotrebi
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ime = String(body?.ime ?? "").trim();
    const prezime = String(body?.prezime ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const lozinka = String(body?.lozinka ?? "");
    const uloga = String(body?.uloga ?? "").trim();

    if (!ime || !prezime || !email || !lozinka || !uloga) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Obavezno: ime, prezime, email, lozinka, uloga" },
        { status: 400 }
      ));
    }

    if (!email.includes("@")) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravan email" }, { status: 400 }));
    }

    if (lozinka.length < 6) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Lozinka mora imati najmanje 6 karaktera" },
        { status: 400 }
      ));
    }

    if (!DOZVOLJENE_ULOGE.includes(uloga as any)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravna uloga" }, { status: 400 }));
    }

    const hashedLozinka = await bcrypt.hash(lozinka, 10);

    const result = await query(
      `INSERT INTO korisnik (ime, prezime, email, lozinka_hash, uloga)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_korisnik, ime, prezime, email, uloga`,
      [ime, prezime, email, hashedLozinka, uloga]
    );

    return addCorsHeaders(req, NextResponse.json(
      { message: "Registrovan", user: result.rows[0] },
      { status: 201 }
    ));
  } catch (error: any) {
    if (error?.code === "23505") {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Email je već u upotrebi" },
        { status: 409 }
      ));
    }
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
