import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));
    }

    // 1) Osnovne brojke
    const proizvodiRes = await query(`SELECT COUNT(*)::int AS cnt FROM proizvod`);
    const dobavljaciRes = await query(`SELECT COUNT(*)::int AS cnt FROM dobavljac`);
    const korisniciRes = await query(`SELECT COUNT(*)::int AS cnt FROM korisnik`);

    // 2) Lager: ukupna kolicina i ukupna vrednost 
    const lagerRes = await query(`
      SELECT
        COALESCE(SUM(kolicina_na_lageru), 0)::int AS ukupna_kolicina,
        COALESCE(SUM(cena * kolicina_na_lageru), 0)::float AS ukupna_vrednost
      FROM proizvod
    `);

    // 3) Narudžbenice: ukupno + po tipovima
    const narudzbeniceTotalRes = await query(`SELECT COUNT(*)::int AS cnt FROM narudzbenica`);

    const narudzbeniceTipRes = await query(`
      SELECT tip, COUNT(*)::int AS cnt
      FROM narudzbenica
      GROUP BY tip
    `);

    // 4) Narudžbenice: po statusima 
    const narudzbeniceStatusRes = await query(`
      SELECT status, COUNT(*)::int AS cnt
      FROM narudzbenica
      GROUP BY status
    `);

    // 5) Skorašnje narudžbenice (poslednjih 5)
    const recentRes = await query(`
      SELECT
        n.id_narudzbenica,
        n.datum_kreiranja,
        n.tip,
        n.status,
        n.ukupna_vrednost,
        d.naziv_firme AS dobavljac_naziv
      FROM narudzbenica n
      LEFT JOIN dobavljac d ON n.dobavljac_id = d.id_dobavljac
      ORDER BY n.datum_kreiranja DESC
      LIMIT 5
    `);

    // Pretvori tip/status rezultate u mape radi lakšeg prikaza na frontu
    const narudzbenicePoTipu: Record<string, number> = { NABAVKA: 0, PRODAJA: 0 };
    for (const r of narudzbeniceTipRes.rows) {
      narudzbenicePoTipu[r.tip] = Number(r.cnt);
    }

    const narudzbenicePoStatusu: Record<string, number> = {
      KREIRANA: 0,
      POSLATA: 0,
      U_TRANSPORTU: 0,
      PRIMLJENA: 0,
      ZAVRSENA: 0,
      OTKAZANA: 0,
      STORNIRANA: 0,
    };
    for (const r of narudzbeniceStatusRes.rows) {
      narudzbenicePoStatusu[r.status] = Number(r.cnt);
    }

    return addCorsHeaders(req, NextResponse.json({
      counts: {
        proizvodi: Number(proizvodiRes.rows[0]?.cnt ?? 0),
        dobavljaci: Number(dobavljaciRes.rows[0]?.cnt ?? 0),
        korisnici: Number(korisniciRes.rows[0]?.cnt ?? 0),
        narudzbenice: Number(narudzbeniceTotalRes.rows[0]?.cnt ?? 0),
      },
      lager: {
        ukupna_kolicina: Number(lagerRes.rows[0]?.ukupna_kolicina ?? 0),
        ukupna_vrednost: Number(lagerRes.rows[0]?.ukupna_vrednost ?? 0),
      },
      narudzbenice: {
        po_tipu: narudzbenicePoTipu,
        po_statusu: narudzbenicePoStatusu,
        recent: recentRes.rows ?? [],
      },
    }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}