import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

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