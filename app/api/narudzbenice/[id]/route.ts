import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const VALID_STATUS = ['KREIRANA','POSLATA','U_TRANSPORTU','ISPORUCENA','ZAVRSENA','OTKAZANA'] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    const headerRes = await query(
      `SELECT
        n.id_narudzbenica, n.datum_kreiranja, n.tip, n.status, n.napomena,
        n.ukupna_vrednost, n.pdf_putanja, n.kreirao_id, n.dobavljac_id,
        d.naziv_firme as dobavljac_naziv,
        k.email as kreirao_email
      FROM narudzbenica n
      LEFT JOIN dobavljac d ON n.dobavljac_id = d.id_dobavljac
      LEFT JOIN korisnik k ON n.kreirao_id = k.id_korisnik
      WHERE n.id_narudzbenica = $1`,
      [orderId]
    );

    if (headerRes.rows.length === 0) {
      return NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 });
    }

    const itemsRes = await query(
      `SELECT
        sn.id_stavka, sn.proizvod_id, sn.kolicina, sn.ukupna_cena,
        p.naziv as proizvod_naziv, p.sifra as proizvod_sifra, p.cena as proizvod_cena
      FROM stavka_narudzbenice sn
      JOIN proizvod p ON sn.proizvod_id = p.id_proizvod
      WHERE sn.narudzbenica_id = $1`,
      [orderId]
    );

    return NextResponse.json({ ...headerRes.rows[0], stavke: itemsRes.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Promena statusa + (opciono) ažuriranje lagera kad se završi narudžbenica
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Nemate pristup" }, { status: 401 });

    const { id } = await params;
    const orderId = Number(id);
    const { status } = await req.json();

    if (!status || !VALID_STATUS.includes(status)) {
      return NextResponse.json(
        { error: "Nevalidan status" },
        { status: 400 }
      );
    }

    await query('BEGIN');
    try {
      // Učitaj trenutni tip+status (da znamo šta je bilo pre)
      const curRes = await query(
        `SELECT tip, status FROM narudzbenica WHERE id_narudzbenica = $1`,
        [orderId]
      );
      if (curRes.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 });
      }

      const stariStatus = curRes.rows[0].status;
      const tip = curRes.rows[0].tip;

      // Update status
      const updRes = await query(
        `UPDATE narudzbenica SET status = $1 WHERE id_narudzbenica = $2 RETURNING *`,
        [status, orderId]
      );

      // Lager ažuriraj samo jednom, kad prvi put pređe u ZAVRSENA
      if (status === 'ZAVRSENA' && stariStatus !== 'ZAVRSENA') {
        const itemsRes = await query(
          `SELECT proizvod_id, kolicina FROM stavka_narudzbenice WHERE narudzbenica_id = $1`,
          [orderId]
        );

        for (const it of itemsRes.rows) {
          if (tip === 'NABAVKA') {
            await query(
              `UPDATE proizvod
               SET kolicina_na_lageru = kolicina_na_lageru + $1
               WHERE id_proizvod = $2`,
              [it.kolicina, it.proizvod_id]
            );
          } else if (tip === 'PRODAJA') {
            // ne dozvoli da ode ispod nule
            const check = await query(
              `SELECT kolicina_na_lageru FROM proizvod WHERE id_proizvod = $1`,
              [it.proizvod_id]
            );
            const trenutno = Number(check.rows[0].kolicina_na_lageru);
            if (trenutno < Number(it.kolicina)) {
              throw new Error(`Nema dovoljno lagera za proizvod ${it.proizvod_id}`);
            }

            await query(
              `UPDATE proizvod
               SET kolicina_na_lageru = kolicina_na_lageru - $1
               WHERE id_proizvod = $2`,
              [it.kolicina, it.proizvod_id]
            );
          }
        }
      }

      await query('COMMIT');

      return NextResponse.json({ message: "Status ažuriran", order: updRes.rows[0] });
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Nemate pristup" }, { status: 401 });

    const { id } = await params;
    const orderId = Number(id);

    // Bezbedno brisanje: samo ako je KREIRANA (po UML statusima)
    const checkRes = await query(
      `SELECT status FROM narudzbenica WHERE id_narudzbenica = $1`,
      [orderId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 });
    }

    if (checkRes.rows[0].status !== 'KREIRANA') {
      return NextResponse.json(
        { error: "Možeš obrisati samo narudžbenice u statusu KREIRANA" },
        { status: 400 }
      );
    }

    // prvo obriši stavke (FK)
    await query(`DELETE FROM stavka_narudzbenice WHERE narudzbenica_id = $1`, [orderId]);
    await query(`DELETE FROM narudzbenica WHERE id_narudzbenica = $1`, [orderId]);

    return NextResponse.json({ message: "Narudžbenica obrisana" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}