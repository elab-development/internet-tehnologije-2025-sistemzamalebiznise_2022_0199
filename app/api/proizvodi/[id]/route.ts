import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * @swagger
 * /api/proizvodi/{id}:
 *   get:
 *     summary: Dohvati proizvod po ID-ju
 *     description: Vraća detalje jednog proizvoda.
 *     tags: [Proizvodi]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID proizvoda
 *     responses:
 *       200:
 *         description: Detalji proizvoda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proizvod'
 *       403:
 *         description: Nemate pristup
 *       404:
 *         description: Proizvod nije pronađen
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);
    //proveriti
    const authUser = await requireAuth(req);
    if (!authUser) {
      return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 403 }));
    }

    const result = await query(
      `SELECT id_proizvod, naziv, sifra, cena, nabavna_cena, prodajna_cena,
       kolicina_na_lageru, minimalna_kolicina, jedinica_mere,
       datum_kreiranja, datum_izmene
       FROM proizvod
       WHERE id_proizvod = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 }));
    }

    return addCorsHeaders(req, NextResponse.json(result.rows[0]));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * @swagger
 * /api/proizvodi/{id}:
 *   put:
 *     summary: Ažuriraj proizvod
 *     description: Ažurira podatke proizvoda. Nabavna cena se NE SME menjati. Prodajna cena mora biti veća od nabavne. Samo VLASNIK ima pristup.
 *     tags: [Proizvodi]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID proizvoda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               naziv:
 *                 type: string
 *               sifra:
 *                 type: string
 *               prodajna_cena:
 *                 type: number
 *               kolicina_na_lageru:
 *                 type: integer
 *               minimalna_kolicina:
 *                 type: integer
 *               jedinica_mere:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proizvod uspešno ažuriran
 *       400:
 *         description: Prodajna cena mora biti veća od nabavne
 *       401:
 *         description: Neautorizovan pristup
 *       403:
 *         description: Samo vlasnik može da menja proizvode
 *       404:
 *         description: Proizvod nije pronađen
 *       409:
 *         description: Šifra proizvoda već postoji
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const uloga = (auth as any).uloga;
    if (uloga !== "VLASNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Samo vlasnik može da menja proizvode" }, { status: 403 }));
    }

    const { id } = await params;
    const productId = Number(id);

    const { naziv, sifra, prodajna_cena, kolicina_na_lageru, minimalna_kolicina, jedinica_mere } = await req.json();

    // Provera da prodajna cena nije manja od nabavne
    if (prodajna_cena !== undefined) {
      const existing = await query(`SELECT nabavna_cena FROM proizvod WHERE id_proizvod = $1`, [productId]);
      if (existing.rows.length > 0 && Number(prodajna_cena) <= Number(existing.rows[0].nabavna_cena)) {
        return addCorsHeaders(req, NextResponse.json(
          { error: "Prodajna cena mora biti veća od nabavne" },
          { status: 400 }
        ));
      }
    }

    // VAŽNO: nabavna_cena se NE SME menjati nakon kreiranja!
    // Ažuriramo samo ostala polja
    const result = await query(
      `UPDATE proizvod
       SET
         naziv = COALESCE($2, naziv),
         sifra = COALESCE($3, sifra),
         cena = COALESCE($4, cena),
         prodajna_cena = COALESCE($4, prodajna_cena),
         kolicina_na_lageru = COALESCE($5, kolicina_na_lageru),
         minimalna_kolicina = COALESCE($6, minimalna_kolicina),
         jedinica_mere = COALESCE($7, jedinica_mere)
       WHERE id_proizvod = $1
       RETURNING id_proizvod, naziv, sifra, cena, nabavna_cena, prodajna_cena,
                 kolicina_na_lageru, minimalna_kolicina, jedinica_mere,
                 datum_kreiranja, datum_izmene`,
      [productId, naziv, sifra, prodajna_cena, kolicina_na_lageru, minimalna_kolicina, jedinica_mere]
    );

    if (result.rows.length === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 }));
    }

    return addCorsHeaders(req, NextResponse.json({ message: "Proizvod ažuriran", product: result.rows[0] }));
  } catch (error: any) {
    if (error.code === '23505') {
      return addCorsHeaders(req, NextResponse.json({ error: "Šifra proizvoda već postoji" }, { status: 409 }));
    }
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * @swagger
 * /api/proizvodi/{id}:
 *   delete:
 *     summary: Obriši proizvod
 *     description: Briše proizvod iz sistema. Samo VLASNIK ima pristup.
 *     tags: [Proizvodi]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID proizvoda
 *     responses:
 *       200:
 *         description: Proizvod uspešno obrisan
 *       401:
 *         description: Neautorizovan pristup
 *       403:
 *         description: Samo vlasnik može da briše proizvode
 *       404:
 *         description: Proizvod nije pronađen
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return addCorsHeaders(req, NextResponse.json({ error: "Nemate pristup" }, { status: 401 }));

    const uloga = (auth as any).uloga;
    if (uloga !== "VLASNIK") {
      return addCorsHeaders(req, NextResponse.json({ error: "Samo vlasnik može da briše proizvode" }, { status: 403 }));
    }

    const { id } = await params;
    const productId = Number(id);

    // Poziv SQL funkcije iz migracije 03_funkcije_brisanje.sql
    const result = await query(
      `SELECT obrisi_proizvod($1) AS id_proizvod`,
      [productId]
    );

    if (result.rows.length === 0 || result.rows[0].id_proizvod === null) {
      return addCorsHeaders(req, NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 }));
    }

    return addCorsHeaders(req, NextResponse.json({ message: "Proizvod obrisan" }));
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
