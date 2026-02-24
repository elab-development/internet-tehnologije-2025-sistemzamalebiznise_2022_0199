import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const DOZVOLJENE_ULOGE = ["VLASNIK", "RADNIK"];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    
    // Provera autentifikacije
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 }));
    }

    const uloga = (auth as any).uloga;
    
    // DOSTAVLJAC nema pristup lageru
    if (!DOZVOLJENE_ULOGE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    // Vraća sve proizvode sa informacijama o lageru
    const result = await query(`
      SELECT
        id_proizvod,
        naziv,
        sifra,
        nabavna_cena,
        prodajna_cena,
        kolicina_na_lageru,
        minimalna_kolicina,
        jedinica_mere,
        datum_kreiranja,
        datum_izmene
      FROM proizvod
      ORDER BY naziv ASC
    `);

    return addCorsHeaders(req, NextResponse.json(result.rows || []));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
