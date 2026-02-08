import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const result = await query(`
      SELECT
        id_proizvod, naziv, sifra, cena, kolicina_na_lageru, jedinica_mere
      FROM proizvod
      ORDER BY id_proizvod DESC
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

    const { naziv, sifra, cena, kolicina_na_lageru, jedinica_mere } = await req.json();

    if (!naziv || !sifra || cena === undefined || !jedinica_mere) {
      return NextResponse.json(
        { error: "Obavezno: naziv, sifra, cena, jedinica_mere" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO proizvod (naziv, sifra, cena, kolicina_na_lageru, jedinica_mere)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_proizvod, naziv, sifra, cena, kolicina_na_lageru, jedinica_mere`,
      [naziv, sifra, cena, kolicina_na_lageru ?? 0, jedinica_mere]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    // unique violation for sifra
    if (error.code === '23505') {
      return NextResponse.json({ error: "Šifra proizvoda već postoji" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}