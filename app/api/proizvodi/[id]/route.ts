import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    const result = await query(
      `SELECT id_proizvod, naziv, sifra, cena, kolicina_na_lageru, jedinica_mere
       FROM proizvod
       WHERE id_proizvod = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: "Nemate pristup" }, { status: 401 });

    const { id } = await params;
    const productId = Number(id);

    const { naziv, sifra, cena, kolicina_na_lageru, jedinica_mere } = await req.json();

    const result = await query(
      `UPDATE proizvod SET
        naziv = COALESCE($1, naziv),
        sifra = COALESCE($2, sifra),
        cena = COALESCE($3, cena),
        kolicina_na_lageru = COALESCE($4, kolicina_na_lageru),
        jedinica_mere = COALESCE($5, jedinica_mere)
       WHERE id_proizvod = $6
       RETURNING id_proizvod, naziv, sifra, cena, kolicina_na_lageru, jedinica_mere`,
      [naziv, sifra, cena, kolicina_na_lageru, jedinica_mere, productId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
    }

    return NextResponse.json({ message: "Proizvod ažuriran", product: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "Šifra proizvoda već postoji" }, { status: 409 });
    }
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
    const productId = Number(id);

    // UML nema "aktivan" → hard delete
    const result = await query(
      `DELETE FROM proizvod WHERE id_proizvod = $1 RETURNING id_proizvod`,
      [productId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Proizvod nije pronađen" }, { status: 404 });
    }

    return NextResponse.json({ message: "Proizvod obrisan" });
  } catch (error: any) {
    // Ako postoji FK u stavkama narudžbenice → neće dati da obrišeš (to je ok)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}