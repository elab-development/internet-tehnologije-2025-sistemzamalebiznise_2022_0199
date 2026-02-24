import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * @swagger
 * /api/dobavljaci:
 *   get:
 *     summary: Dohvati sve dobavljače
 *     description: Vraća listu svih dobavljača sortiranih po ID-ju.
 *     tags: [Dobavljači]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista dobavljača
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dobavljac'
 *       401:
 *         description: Neautorizovan pristup
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const result = await query(`
      SELECT id_dobavljac, naziv_firme, telefon, email, adresa
      FROM dobavljac
      ORDER BY id_dobavljac DESC
    `);

    return addCorsHeaders(req, NextResponse.json(result.rows || []));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * @swagger
 * /api/dobavljaci:
 *   post:
 *     summary: Kreiraj novog dobavljača
 *     description: Dodaje novog dobavljača u sistem.
 *     tags: [Dobavljači]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [naziv_firme]
 *             properties:
 *               naziv_firme:
 *                 type: string
 *                 example: Tech Distributer d.o.o.
 *               telefon:
 *                 type: string
 *                 example: "+381601234567"
 *               email:
 *                 type: string
 *                 example: info@techdist.rs
 *               adresa:
 *                 type: string
 *                 example: Bulevar Oslobođenja 10, Beograd
 *     responses:
 *       201:
 *         description: Dobavljač uspešno kreiran
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dobavljac'
 *       400:
 *         description: Naziv firme je obavezan
 *       401:
 *         description: Neautorizovan pristup
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const { naziv_firme, telefon, email, adresa } = await req.json();

    if (!naziv_firme) {
      return addCorsHeaders(req, NextResponse.json({ error: "Naziv firme je obavezan" }, { status: 400 }));
    }

    const result = await query(
      `INSERT INTO dobavljac (naziv_firme, telefon, email, adresa)
       VALUES ($1, $2, $3, $4)
       RETURNING id_dobavljac, naziv_firme, telefon, email, adresa`,
      [naziv_firme, telefon ?? null, email ?? null, adresa ?? null]
    );

    return addCorsHeaders(req, NextResponse.json(result.rows[0], { status: 201 }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}