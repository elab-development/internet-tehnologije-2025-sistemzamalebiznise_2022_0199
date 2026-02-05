import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { id_korisnik, stavke, ukupna_cena } = await req.json();

    // Pokrećemo transakciju
    await query('BEGIN');

    // 1. Kreiramo zaglavlje narudžbenice
    const orderRes = await query(
      'INSERT INTO narudzbenica (id_korisnik, ukupna_cena) VALUES ($1, $2) RETURNING id_narudzbenica',
      [id_korisnik, ukupna_cena]
    );
    const orderId = orderRes.rows[0].id_narudzbenica;

    // 2. Upisujemo stavke i ažuriramo lager
    for (const stavka of stavke) {
      // Upis stavke
      await query(
        'INSERT INTO stavka_narudzbenice (id_narudzbenica, id_proizvod, kolicina, cena_po_komadu) VALUES ($1, $2, $3, $4)',
        [orderId, stavka.id_proizvod, stavka.kolicina, stavka.cena]
      );

      // Smanjivanje lagera u tabeli proizvod
      await query(
        'UPDATE proizvod SET kolicina_na_lageru = kolicina_na_lageru - $1 WHERE id_proizvod = $2',
        [stavka.kolicina, stavka.id_proizvod]
      );
    }

    // Ako je sve prošlo ok, snimamo promene
    await query('COMMIT');

    return NextResponse.json({ message: "Narudžbenica uspešno kreirana", orderId }, { status: 201 });

  } catch (error: any) {
    // Ako nešto pukne, poništavamo sve promene u bazi
    await query('ROLLBACK');
    console.error("Order error:", error);
    return NextResponse.json({ error: "Greška pri kreiranju narudžbenice" }, { status: 500 });
  }
}