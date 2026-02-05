import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { email, lozinka } = await req.json();

    // 1. Validacija unosa
    if (!email || !lozinka) {
      return NextResponse.json({ error: "Email i lozinka su obavezni" }, { status: 400 });
    }

    // 2. Provera da li korisnik postoji
    const result = await query('SELECT * FROM "Korisnik" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Pogrešan email ili lozinka" }, { status: 401 });
    }

    // 3. Provera lozinke (poredimo običan tekst sa hešom iz baze)
    const lozinkaTacna = await bcrypt.compare(lozinka, user.lozinka);

    if (!lozinkaTacna) {
      return NextResponse.json({ error: "Pogrešan email ili lozinka" }, { status: 401 });
    }

    // 4. Kreiranje JWT tokena
    const token = jwt.sign(
      { userId: user.id_korisnik, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' } // Token traje sat vremena
    );

    // 5. Slanje odgovora (opciono: možeš poslati token i u HTTP-only kolačiću)
    const response = NextResponse.json({
      message: "Uspešna prijava",
      user: { id: user.id_korisnik, ime: user.ime, email: user.email }
    }, { status: 200 });

    // Postavljanje tokena u kolačić (browser će ga automatski čuvati)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
    });

    return response;

 }  catch (error: any) {
  // Ovo će ti ispisati tačan razlog u Thunder Client-u
    return NextResponse.json({ 
    error: error.message, 
    detail: error.detail, // Postgres često ovde piše šta fali
    code: error.code }, 
    { status: 500 });
    }
}