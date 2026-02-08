import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const result = await query(`
      SELECT id_dobavljac, naziv_firme, telefon, email, adresa
      FROM dobavljac
      ORDER BY id_dobavljac DESC
    `);

    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Nemate pristup" }, { status: 401 });

    const { naziv_firme, telefon, email, adresa } = await req.json();

    if (!naziv_firme) {
      return NextResponse.json({ error: "Naziv firme je obavezan" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO dobavljac (naziv_firme, telefon, email, adresa)
       VALUES ($1, $2, $3, $4)
       RETURNING id_dobavljac, naziv_firme, telefon, email, adresa`,
      [naziv_firme, telefon ?? null, email ?? null, adresa ?? null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}