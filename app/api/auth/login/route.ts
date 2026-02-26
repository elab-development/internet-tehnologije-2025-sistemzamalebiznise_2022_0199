import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Prijava korisnika
 *     description: Autentifikuje korisnika putem email-a i lozinke. Postavlja JWT token kao HttpOnly cookie.
 *     tags: [Autentifikacija]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, lozinka]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marko@example.com
 *               lozinka:
 *                 type: string
 *                 example: lozinka123
 *     responses:
 *       200:
 *         description: Uspešna prijava
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/Korisnik'
 *         headers:
 *           Set-Cookie:
 *             description: JWT token kao HttpOnly cookie
 *             schema:
 *               type: string
 *       400:
 *         description: Neispravan JSON body
 *       401:
 *         description: Pogrešan email ili lozinka
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Neispravan JSON body (pošalji email i lozinka)" },
        { status: 400 }
      ));
    }


    const email = String(body?.email ?? "").trim().toLowerCase();
    const lozinka = String(body?.lozinka ?? "");

    if (!email || !lozinka) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Email i lozinka su obavezni" },
        { status: 400 }
      ));
    }

    const result = await query(
      "SELECT * FROM korisnik WHERE email = $1 LIMIT 1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      ));
    }

    const lozinkaTacna = await bcrypt.compare(lozinka, user.lozinka_hash);
    if (!lozinkaTacna) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      ));
    }

    const jwtSecret = process.env.JWT_SECRET || "kljuc_za_jwt_token";
    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new jose.SignJWT({ userId: user.id_korisnik, email: user.email, uloga: user.uloga })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    const response = NextResponse.json(
      {
        message: "Uspešna prijava",
        user: {
          id_korisnik: user.id_korisnik,
          ime: user.ime,
          prezime: user.prezime,
          email: user.email,
          uloga: user.uloga,
        },
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true, // UVEK true za cross-site
      sameSite: "none", // UVEK 'none' za cross-site
      maxAge: 86400,
      path: "/",
    });

    return addCorsHeaders(req, response);
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
