import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const VALID_STATUS = ['KREIRANA','POSLATA','U_TRANSPORTU','PRIMLJENA','ZAVRSENA','OTKAZANA','STORNIRANA'] as const;
const VALID_TIP = ['NABAVKA','PRODAJA'] as const;

const DOZVOLJENE_ULOGE_KREIRANJE = ["VLASNIK", "RADNIK"];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 }));

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    if (status && !VALID_STATUS.includes(status as any)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravan status" }, { status: 400 }));
}


    const uloga = (auth as any).uloga;
    const userId = (auth as any).userId;

    let sql = `
      SELECT
        n.id_narudzbenica,
        n.datum_kreiranja,
        n.datum_izmene,
        n.datum_zavrsetka,
        n.tip,
        n.status,
        n.napomena,
        n.ukupna_vrednost,
        n.pdf_putanja,
        n.kreirao_id,
        n.dobavljac_id,
        n.dostavljac_id,
        n.stornirana,
        n.datum_storniranja,
        n.razlog_storniranja,
        n.stornirao_id,
        d.naziv_firme as dobavljac_naziv,
        k.email as kreirao_email
      FROM narudzbenica n
      LEFT JOIN dobavljac d ON n.dobavljac_id = d.id_dobavljac
      LEFT JOIN korisnik k ON n.kreirao_id = k.id_korisnik
    `;

    const params: any[] = [];
    const where: string[] = [];

    // filter po statusu (ako je prosleđen)
    if (status) {
      where.push(`n.status = $${params.length + 1}`);
      params.push(status);
    }

    // RBAC: dostavljač vidi samo svoje dodeljene
    if (uloga === "DOSTAVLJAC") {
      where.push(`n.dostavljac_id = $${params.length + 1}`);
      params.push(userId);
    }

    // vlasnik i radnik vide sve

    if (where.length > 0) {
      sql += ` WHERE ` + where.join(" AND ");
    }

    sql += ` ORDER BY n.datum_kreiranja DESC`;

    const result = await query(sql, params);
    return addCorsHeaders(req, NextResponse.json(result.rows || []));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 }));
    }

    const uloga = (auth as any).uloga;
    const userId = (auth as any).userId;

    // RBAC: Samo VLASNIK i RADNIK mogu kreirati narudžbenice
    if (!DOZVOLJENE_ULOGE_KREIRANJE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    const { tip, dobavljac_id, dostavljac_id, napomena, stavke } = await req.json();

    if (!tip || !VALID_TIP.includes(tip) || !Array.isArray(stavke) || stavke.length === 0) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Obavezno: tip (NABAVKA/PRODAJA) i stavke (niz)" },
        { status: 400 }
      ));
    }

    if (tip === 'NABAVKA' && !dobavljac_id) {
      return addCorsHeaders(req, NextResponse.json({ error: "Za NABAVKA mora dobavljac_id" }, { status: 400 }));
    }
    if (tip === 'PRODAJA' && dobavljac_id) {
      return addCorsHeaders(req, NextResponse.json({ error: "Za PRODAJA dobavljac_id mora biti null" }, { status: 400 }));
    }

    // Validacija stavki
    for (const s of stavke) {
      const proizvodId = Number(s.proizvod_id);
      const kolicina = Number(s.kolicina);

      if (!proizvodId || !kolicina || kolicina <= 0) {
        return addCorsHeaders(req, NextResponse.json(
          { error: "Svaka stavka mora imati proizvod_id i kolicina > 0" },
          { status: 400 }
        ));
      }
    }

    // Koristi funkciju iz baze koja automatski:
    // - Kod PRODAJE postavlja prodajnu_cena snapshot u stavci
    // - Računa ukupnu vrednost
    // - Postavlja datumKreiranja
    const result = await query(
      `SELECT * FROM kreiraj_narudzbenicu($1, $2, $3, $4, $5, $6)`,
      [
        tip,
        userId, // kreirao_id
        dobavljac_id ?? null,
        dostavljac_id ?? null,
        napomena ?? null,
        JSON.stringify(stavke)
      ]
    );

    if (result.rows.length === 0) {
      throw new Error("Greška pri kreiranju narudžbenice");
    }

    const createdOrder = result.rows[0];

    return addCorsHeaders(req, NextResponse.json(
      {
        message: "Narudžbenica kreirana",
        id_narudzbenica: createdOrder.id_narudzbenica,
        tip: createdOrder.tip,
        status: createdOrder.status,
        ukupna_vrednost: parseFloat(createdOrder.ukupna_vrednost || 0),
        datum_kreiranja: createdOrder.datum_kreiranja
      },
      { status: 201 }
    ));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}