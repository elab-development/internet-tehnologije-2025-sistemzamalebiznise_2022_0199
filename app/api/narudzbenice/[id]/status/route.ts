import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
import { posaljiObavestenjeVlasniku } from '@/lib/slanjeMejla';

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const VALID_STATUS = ['KREIRANA', 'U_TRANSPORTU', 'ZAVRSENA', 'OTKAZANA', 'STORNIRANA'] as const;

const DOZVOLJENE_ULOGE_ZAVRSAVANJE = ["VLASNIK", "RADNIK"];
const DOZVOLJENE_ULOGE_STORNIRANJE = ["VLASNIK", "RADNIK"];

// Dozvoljeni prelazi statusa za NABAVKU
const NABAVKA_TRANSITIONS: Record<string, string[]> = {
  KREIRANA: ['U_TRANSPORTU', 'OTKAZANA'],
  U_TRANSPORTU: ['ZAVRSENA'],
  ZAVRSENA: [],
  OTKAZANA: [],
  STORNIRANA: [],
};

// Dozvoljeni prelazi statusa za PRODAJU
const PRODAJA_TRANSITIONS: Record<string, string[]> = {
  KREIRANA: ['STORNIRANA', 'ZAVRSENA'],
  POSLATA: [],
  U_TRANSPORTU: [],
  ZAVRSENA: [],
  OTKAZANA: [],
  STORNIRANA: [],
};

/**
 * PATCH /api/narudzbenice/[id]/status
 * 
 * Menja status narudžbenice i automatski upravlja lagerom prema poslovnim pravilima:
 * - NABAVKA: status ZAVRSENA povećava lager
 * - PRODAJA: status ZAVRSENA smanjuje lager (sa proverom dostupnosti)
 * - STORNIRANJE: dozvoljeno samo ako je status KREIRANA
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 }));
    }

    const { id } = await params;
    const orderId = Number(id);
    
    if (!Number.isFinite(orderId)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravan ID" }, { status: 400 }));
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravan JSON body" }, { status: 400 }));
    }

    const { status: noviStatus, razlog_storniranja } = body;

    if (!noviStatus || !VALID_STATUS.includes(noviStatus)) {
      return addCorsHeaders(req, NextResponse.json(
        { error: `Nevalidan status. Dozvoljeni: ${VALID_STATUS.join(', ')}` },
        { status: 400 }
      ));
    }

    const uloga = (auth as any).uloga;
    const userId = (auth as any).userId;

    // Provera postojanja narudžbenice i njenog tipa
    const checkRes = await query(
      `SELECT tip, status FROM narudzbenica WHERE id_narudzbenica = $1`,
      [orderId]
    );

    if (checkRes.rows.length === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 }));
    }

    const { tip, status: stariStatus } = checkRes.rows[0];

    // RBAC: Samo VLASNIK i RADNIK mogu završavati/primati narudžbenice
    if ((noviStatus === 'ZAVRSENA' || noviStatus === 'PRIMLJENA') && !DOZVOLJENE_ULOGE_ZAVRSAVANJE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    // RBAC: Samo VLASNIK i RADNIK mogu stornirati
    if (noviStatus === 'STORNIRANA' && !DOZVOLJENE_ULOGE_STORNIRANJE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    // Validacija: storniranje samo ako je razlog naveden
    if (noviStatus === 'STORNIRANA' && !razlog_storniranja) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Razlog storniranja je obavezan" },
        { status: 400 }
      ));
    }

    // Provera da li je prelaz statusa validan za dati tip narudžbenice
    const transitions = tip === 'NABAVKA' ? NABAVKA_TRANSITIONS : PRODAJA_TRANSITIONS;
    const dozvoljeniPrelazi = transitions[stariStatus] || [];

    if (stariStatus === noviStatus) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Narudžbenica je već u tom statusu" },
        { status: 400 }
      ));
    }

    if (!dozvoljeniPrelazi.includes(noviStatus)) {
      return addCorsHeaders(req, NextResponse.json(
        { error: `Prelaz iz ${stariStatus} u ${noviStatus} nije dozvoljen za tip ${tip}. Dozvoljeni: ${dozvoljeniPrelazi.join(', ') || 'nema'}` },
        { status: 400 }
      ));
    }

    // Poziv funkcije koja upravlja statusom i lagerom
    try {
      const result = await query(
        `SELECT * FROM izmeni_status_narudzbenice_sa_lagerom($1, $2, $3, $4)`,
        [orderId, noviStatus, razlog_storniranja ?? null, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Greška pri promeni statusa");
      }

      const updatedOrder = result.rows[0];

      let notification: { sent: boolean; message: string } | undefined;
      if (tip === 'PRODAJA' && noviStatus === 'ZAVRSENA') {
        try {
          const lowStockItemsResult = await query(
            `
              SELECT DISTINCT p.naziv, p.kolicina_na_lageru
              FROM stavka_narudzbenice sn
              JOIN proizvod p ON p.id_proizvod = sn.proizvod_id
              WHERE sn.narudzbenica_id = $1
                AND p.kolicina_na_lageru <= 5
              ORDER BY p.naziv ASC
            `,
            [orderId]
          );

          const lowStockItems = lowStockItemsResult.rows || [];

          for (const item of lowStockItems) {
            await posaljiObavestenjeVlasniku(
              String(item.naziv),
              Number(item.kolicina_na_lageru)
            );
          }

          notification = {
            sent: true,
            message:
              lowStockItems.length > 0
                ? `Poslato ${lowStockItems.length} obaveštenja vlasniku za proizvode sa lagerom <= 5.`
                : 'Nema proizvoda iz ove prodaje sa lagerom <= 5.',
          };
        } catch (mailError: any) {
          notification = {
            sent: false,
            message: `Status je promenjen, ali slanje mejla nije uspelo: ${mailError.message}`,
          };
        }
      }

      return addCorsHeaders(req, NextResponse.json({
        message: "Status uspešno promenjen",
        id_narudzbenica: updatedOrder.id_narudzbenica,
        status: updatedOrder.status,
        datum_zavrsetka: updatedOrder.datum_zavrsetka,
        stornirana: updatedOrder.stornirana,
        notification
      }));

    } catch (dbError: any) {
      // Posebno rukovanje greškama iz baze (npr. nema dovoljno zaliha)
      return addCorsHeaders(req, NextResponse.json(
        { error: dbError.message },
        { status: 400 }
      ));
    }

  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
