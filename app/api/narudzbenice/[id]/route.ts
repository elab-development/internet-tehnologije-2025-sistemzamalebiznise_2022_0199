import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const VALID_STATUS = ['KREIRANA', 'POSLATA', 'U_TRANSPORTU', 'PRIMLJENA', 'ZAVRSENA', 'OTKAZANA', 'STORNIRANA'] as const;

/**
 * @swagger
 * /api/narudzbenice/{id}:
 *   get:
 *     summary: Dohvati narudžbenicu po ID-ju
 *     description: Vraća detalje narudžbenice sa svim stavkama. DOSTAVLJAC vidi samo sebi dodeljene narudžbenice.
 *     tags: [Narudžbenice]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID narudžbenice
 *     responses:
 *       200:
 *         description: Detalji narudžbenice sa stavkama
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Narudzbenica'
 *                 - type: object
 *                   properties:
 *                     stavke:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StavkaNarudzbenice'
 *       400:
 *         description: Neispravan ID
 *       401:
 *         description: Nemate pristup
 *       403:
 *         description: Nemate pristup (dostavljac)
 *       404:
 *         description: Narudžbenica nije pronađena
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const uloga = (auth as any).uloga;
    const userId = (auth as any).userId;

    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isFinite(orderId)) {
      return addCorsHeaders(req, NextResponse.json({ error: "Neispravan ID" }, { status: 400 }));
    }

    const headerRes = await query(
      `SELECT
        n.id_narudzbenica, n.datum_kreiranja, n.datum_izmene, n.datum_zavrsetka,
        n.tip, n.status, n.napomena, n.ukupna_vrednost, n.pdf_putanja,
        n.kreirao_id, n.dobavljac_id, n.dostavljac_id,
        n.stornirana, n.datum_storniranja, n.razlog_storniranja, n.stornirao_id,
        d.naziv_firme as dobavljac_naziv,
        k.email as kreirao_email
      FROM narudzbenica n
      LEFT JOIN dobavljac d ON n.dobavljac_id = d.id_dobavljac
      LEFT JOIN korisnik k ON n.kreirao_id = k.id_korisnik
      WHERE n.id_narudzbenica = $1`,
      [orderId]
    );

    if (headerRes.rows.length === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 }));
    }

    // Dostavljač sme samo svoju dodeljenu
    if (uloga === "DOSTAVLJAC" && headerRes.rows[0].dostavljac_id !== userId) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    const itemsRes = await query(
      `SELECT
        sn.id_stavka, sn.proizvod_id, sn.kolicina, sn.ukupna_cena, sn.prodajna_cena, sn.datum_kreiranja,
        p.naziv as proizvod_naziv, p.sifra as proizvod_sifra, p.prodajna_cena as proizvod_cena
      FROM stavka_narudzbenice sn
      JOIN proizvod p ON sn.proizvod_id = p.id_proizvod
      WHERE sn.narudzbenica_id = $1`,
      [orderId]
    );

    return addCorsHeaders(req, NextResponse.json({ ...headerRes.rows[0], stavke: itemsRes.rows }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * @swagger
 * /api/narudzbenice/{id}:
 *   patch:
 *     summary: Promeni status narudžbenice
 *     description: Menja status narudžbenice i automatski ažurira lager pri završavanju. VLASNIK i RADNIK mogu menjati, DOSTAVLJAC samo za dodeljene.
 *     tags: [Narudžbenice]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID narudžbenice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [KREIRANA, POSLATA, U_TRANSPORTU, PRIMLJENA, ZAVRSENA, OTKAZANA, STORNIRANA]
 *                 example: ZAVRSENA
 *               dostavljac_id:
 *                 type: integer
 *                 description: Samo VLASNIK može da dodeli dostavljaca
 *     responses:
 *       200:
 *         description: Status uspešno ažuriran
 *       400:
 *         description: Nevalidan status ili neispravan JSON
 *       401:
 *         description: Nemate pristup
 *       403:
 *         description: Nemate pravo da menjate status
 *       404:
 *         description: Narudžbenica nije pronađena
 */
// Promena statusa i ažuriranje lagera kad se završi narudžbenica
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const { id } = await params;
    const orderId = Number(id);
    let body: any = {};
    try { body = await req.json(); }
    catch { return addCorsHeaders(req, NextResponse.json({ error: "Neispravan JSON body" }, { status: 400 })); }

    const { status, dostavljac_id } = body;

    const uloga = (auth as any).uloga;
    const userId = (auth as any).userId;

    // VLASNIK i DOSTAVLJAC menjaju sve; RADNIK samo PRODAJU
    if (uloga !== "VLASNIK" && uloga !== "DOSTAVLJAC" && uloga !== "RADNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pravo da menjate status" }, { status: 403 }));
    }


    if (!status || !VALID_STATUS.includes(status)) {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Nevalidan status" },
        { status: 400 }
      ));
    }

    await query('BEGIN');
    try {
      const curRes = await query(
        `SELECT tip, status, dostavljac_id FROM narudzbenica WHERE id_narudzbenica = $1`,
        [orderId]
      );

      const dodeljeni = curRes.rows[0].dostavljac_id;

      // dostavljač sme samo svoju
      if (uloga === "DOSTAVLJAC" && dodeljeni !== userId) {
        await query('ROLLBACK');
        return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup ovoj narudžbenici" }, { status: 403 }));
      }

      // samo vlasnik sme da dodeli dostavljača
      if (dostavljac_id !== undefined && uloga !== "VLASNIK") {
        await query('ROLLBACK');
        return addCorsHeaders(req, NextResponse.json({ error: "Samo vlasnik može da dodeli dostavljača" }, { status: 403 }));
      }


      if (curRes.rows.length === 0) {
        await query('ROLLBACK');
        return addCorsHeaders(req, NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 }));
      }

      const stariStatus = curRes.rows[0].status;
      const tip = curRes.rows[0].tip;

      // RADNIK sme samo PRODAJU
      if (uloga === "RADNIK" && tip !== "PRODAJA") {
        await query('ROLLBACK');
        return addCorsHeaders(req, NextResponse.json({ error: "Radnik može menjati status samo za PRODAJU" }, { status: 403 }));
      }

      const updRes = await query(
        `UPDATE narudzbenica
        SET status = $1,
        dostavljac_id = COALESCE($2, dostavljac_id)
        WHERE id_narudzbenica = $3
        RETURNING *`,
        [status, dostavljac_id ?? null, orderId]
      );


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

      return addCorsHeaders(req, NextResponse.json({ message: "Status ažuriran", order: updRes.rows[0] }));
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }

  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * @swagger
 * /api/narudzbenice/{id}:
 *   delete:
 *     summary: Obriši narudžbenicu
 *     description: Briše narudžbenicu i njene stavke. Dozvoljeno samo za narudžbenice u statusu KREIRANA. Samo VLASNIK ima pristup.
 *     tags: [Narudžbenice]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID narudžbenice
 *     responses:
 *       200:
 *         description: Narudžbenica uspešno obrisana
 *       400:
 *         description: Možete obrisati samo narudžbenice u statusu KREIRANA
 *       401:
 *         description: Nemate pristup
 *       403:
 *         description: Samo vlasnik može da briše narudžbenice
 *       404:
 *         description: Narudžbenica nije pronađena
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const { id } = await params;
    const orderId = Number(id);

    const uloga = (auth as any).uloga;
    if (uloga !== "VLASNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Samo vlasnik može da briše narudžbenice" }, { status: 403 }));
    }

    const checkRes = await query(
      `SELECT status FROM narudzbenica WHERE id_narudzbenica = $1`,
      [orderId]
    );

    if (checkRes.rows.length === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: "Narudžbenica nije pronađena" }, { status: 404 }));
    }

    if (checkRes.rows[0].status !== 'KREIRANA') {
      return addCorsHeaders(req, NextResponse.json(
        { error: "Možeš obrisati samo narudžbenice u statusu KREIRANA" },
        { status: 400 }
      ));
    }

    await query(`DELETE FROM stavka_narudzbenice WHERE narudzbenica_id = $1`, [orderId]);
    await query(`DELETE FROM narudzbenica WHERE id_narudzbenica = $1`, [orderId]);

    return addCorsHeaders(req, NextResponse.json({ message: "Narudžbenica obrisana" }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}