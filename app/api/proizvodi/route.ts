import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const DOZVOLJENE_ULOGE_PREGLED = ["VLASNIK", "RADNIK", "DOSTAVLJAC"];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Nemate pristup" }, { status: 401 });

    const uloga = (auth as any).uloga;
    if (!DOZVOLJENE_ULOGE_PREGLED.includes(uloga)) {
      return NextResponse.json({ error: "Nemate pristup" }, { status: 403 });
    }

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

    const uloga = (auth as any).uloga;
    if (uloga !== "VLASNIK") {
      return NextResponse.json({ error: "Samo vlasnik može da dodaje proizvode" }, { status: 403 });
    }

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
    if (error.code === '23505') {
      return NextResponse.json({ error: "Šifra proizvoda već postoji" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
