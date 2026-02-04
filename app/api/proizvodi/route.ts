import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { naziv, sifra, cena, kolicina } = body;

    
    if (!naziv || !sifra || !cena) {
      return NextResponse.json({ error: "Nedostaju podaci" }, { status: 400 });
    }

    const res = await query(
      'INSERT INTO proizvod (naziv, sifra, cena, kolicina_na_lageru, aktivan) VALUES ($1, $2, $3, $4, true) RETURNING *',
      [naziv, sifra, cena, kolicina]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error("Database Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await query('SELECT * FROM proizvod');
    
    return NextResponse.json(result.rows || []); 
  } catch (error) {
    
    return NextResponse.json([], { status: 500 });
  }
}