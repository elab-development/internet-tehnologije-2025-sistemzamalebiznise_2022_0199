import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { ime, prezime, email, lozinka } = await req.json();

    // 1. Validacija
    if (!ime || !prezime || !email || !lozinka) {
      return NextResponse.json({ error: "Sva polja su obavezna" }, { status: 400 });
    }

    // 2. Heširanje lozinke
    const salt = await bcrypt.genSalt(10);
    const hashedLozinka = await bcrypt.hash(lozinka, salt);

    // 3. Upis u bazu
    const result = await query(
      'INSERT INTO korisnik (ime, prezime, email, lozinka) VALUES ($1, $2, $3, $4) RETURNING id_korisnik, email',
      [ime, prezime, email, hashedLozinka]
    );

    return NextResponse.json({ 
      message: "Korisnik uspešno registrovan", 
      user: result.rows[0] 
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === '23505') { // Jedinstveni kod za dupli email u Postgresu
      return NextResponse.json({ error: "Email je već u upotrebi" }, { status: 409 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}