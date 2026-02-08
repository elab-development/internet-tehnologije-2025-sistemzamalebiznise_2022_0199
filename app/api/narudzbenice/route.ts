import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const VALID_STATUS = ['KREIRANA','POSLATA','U_TRANSPORTU','ISPORUCENA','ZAVRSENA','OTKAZANA'] as const;
const VALID_TIP = ['NABAVKA','PRODAJA'] as const;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');

    let sql = `
      SELECT
        n.id_narudzbenica,
        n.datum_kreiranja,
        n.tip,
        n.status,
        n.napomena,
        n.ukupna_vrednost,
        n.pdf_putanja,
        n.kreirao_id,
        n.dobavljac_id,
        d.naziv_firme as dobavljac_naziv,
        k.email as kreirao_email
      FROM narudzbenica n
      LEFT JOIN dobavljac d ON n.dobavljac_id = d.id_dobavljac
      LEFT JOIN korisnik k ON n.kreirao_id = k.id_korisnik
    `;

    const params: any[] = [];
    if (status) {
      sql += ` WHERE n.status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY n.datum_kreiranja DESC`;

    const result = await query(sql, params);
    return NextResponse.json(result.rows || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Nemate pristup" }, { status: 401 });

    const { tip, dobavljac_id, napomena, stavke } = await req.json();

    if (!tip || !VALID_TIP.includes(tip) || !Array.isArray(stavke) || stavke.length === 0) {
      return NextResponse.json(
        { error: "Obavezno: tip (NABAVKA/PRODAJA) i stavke (niz)" },
        { status: 400 }
      );
    }

    if (tip === 'NABAVKA' && !dobavljac_id) {
      return NextResponse.json({ error: "Za NABAVKA mora dobavljac_id" }, { status: 400 });
    }
    if (tip === 'PRODAJA' && dobavljac_id) {
      return NextResponse.json({ error: "Za PRODAJA dobavljac_id mora biti null" }, { status: 400 });
    }

    await query('BEGIN');
    try {
      // 1) napravi header
      const headerRes = await query(
        `INSERT INTO narudzbenica (tip, status, napomena, ukupna_vrednost, pdf_putanja, kreirao_id, dobavljac_id)
         VALUES ($1, 'KREIRANA', $2, 0, NULL, $3, $4)
         RETURNING id_narudzbenica, tip, status, kreirao_id, dobavljac_id, datum_kreiranja`,
        [tip, napomena ?? null, (auth as any).userId, dobavljac_id ?? null]
      );

      const orderId = headerRes.rows[0].id_narudzbenica;

      // 2) ubaci stavke + izračunaj ukupno iz proizvod.cena
      let ukupno = 0;

      for (const s of stavke) {
        const proizvodId = Number(s.proizvod_id);
        const kolicina = Number(s.kolicina);

        if (!proizvodId || !kolicina || kolicina <= 0) {
          throw new Error("Svaka stavka mora imati proizvod_id i kolicina > 0");
        }

        const pRes = await query(
          `SELECT cena FROM proizvod WHERE id_proizvod = $1`,
          [proizvodId]
        );
        if (pRes.rows.length === 0) throw new Error(`Proizvod ${proizvodId} ne postoji`);

        const cena = Number(pRes.rows[0].cena);
        const ukupnaCenaStavke = cena * kolicina;
        ukupno += ukupnaCenaStavke;

        await query(
          `INSERT INTO stavka_narudzbenice (kolicina, ukupna_cena, proizvod_id, narudzbenica_id)
           VALUES ($1, $2, $3, $4)`,
          [kolicina, ukupnaCenaStavke, proizvodId, orderId]
        );
      }

      // 3) upiši ukupno u header
      await query(
        `UPDATE narudzbenica SET ukupna_vrednost = $1 WHERE id_narudzbenica = $2`,
        [ukupno, orderId]
      );

      await query('COMMIT');

      return NextResponse.json(
        { message: "Narudžbenica kreirana", id_narudzbenica: orderId, ukupna_vrednost: ukupno },
        { status: 201 }
      );
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}