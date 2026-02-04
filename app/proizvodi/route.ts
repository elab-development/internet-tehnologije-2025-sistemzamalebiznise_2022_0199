import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { naziv, sifra, cena, kolicina } = await req.json();
    
    const sql = `
      INSERT INTO Proizvod (naziv, sifra, cena, kolicina_na_lageru, aktivan) 
      VALUES ($1, $2, $3, $4, true) RETURNING *`;
    
    const res = await query(sql, [naziv, sifra, cena, kolicina]);
    
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Greška pri čuvanju" }, { status: 500 });
  }
}