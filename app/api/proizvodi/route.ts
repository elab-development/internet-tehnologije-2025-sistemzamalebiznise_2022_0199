import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const DOZVOLJENE_ULOGE_PREGLED = ["VLASNIK", "RADNIK", "DOSTAVLJAC"];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const uloga = (auth as any).uloga;
    if (!DOZVOLJENE_ULOGE_PREGLED.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    const result = await query(`
      SELECT
        id_proizvod, naziv, sifra, 
        cena, nabavna_cena, prodajna_cena,
        kolicina_na_lageru, minimalna_kolicina, jedinica_mere,
        datum_kreiranja, datum_izmene
      FROM proizvod
      ORDER BY id_proizvod DESC
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

    const uloga = (auth as any).uloga;
    if (uloga !== "VLASNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Samo vlasnik može da dodaje proizvode" }, { status: 403 }));
    }

    const { naziv, sifra, nabavna_cena, prodajna_cena, kolicina_na_lageru, minimalna_kolicina, jedinica_mere } = await req.json();

    if (!naziv || !sifra || nabavna_cena === undefined || prodajna_cena === undefined || !jedinica_mere) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Obavezno: naziv, sifra, nabavna_cena, prodajna_cena, jedinica_mere" },
        { status: 400 }
      ));
    }

    if (Number(prodajna_cena) <= Number(nabavna_cena)) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Prodajna cena mora biti veća od nabavne" },
        { status: 400 }
      ));
    }

    const result = await query(
      `INSERT INTO proizvod (naziv, sifra, cena, nabavna_cena, prodajna_cena, kolicina_na_lageru, minimalna_kolicina, jedinica_mere)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_proizvod, naziv, sifra, cena, nabavna_cena, prodajna_cena, kolicina_na_lageru, minimalna_kolicina, jedinica_mere, datum_kreiranja`,
      [naziv, sifra, prodajna_cena, nabavna_cena, prodajna_cena, kolicina_na_lageru ?? 0, minimalna_kolicina ?? null, jedinica_mere]
    );

    return addCorsHeaders(req, NextResponse.json(result.rows[0], { status: 201 }));
  } catch (error: any) {
    if (error.code === '23505') {
      return addCorsHeaders(req, NextResponse.json({ error: "Šifra proizvoda već postoji" }, { status: 409 }));
    }
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
