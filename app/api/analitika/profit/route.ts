import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from '@/lib/cors';

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    // Provera autentifikacije
    const auth = await requireAuth(req);
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Nemate pristup' }, { status: 401 }));
    }

    // Provera da je korisnik VLASNIK
    const uloga = (auth as any).uloga;
    if (uloga !== 'VLASNIK') {
      return addCorsHeaders(
        req,
        NextResponse.json({ error: 'Samo vlasnik može pristupiti analitici' }, { status: 403 })
      );
    }

    // 1. Izračunaj profit po danima za poslednjih 30 dana
    const rezultatProfitPoDanima = await query(
      `SELECT 
        DATE(n.datum_kreiranja) as datum,
        SUM((p.prodajna_cena - p.nabavna_cena) * sn.kolicina) as profit
       FROM narudzbenica n
       JOIN stavka_narudzbenice sn ON n.id_narudzbenica = sn.narudzbenica_id
       JOIN proizvod p ON sn.proizvod_id = p.id_proizvod
       WHERE n.tip = 'PRODAJA'
         AND n.status = 'ZAVRSENA'
         AND n.datum_kreiranja >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(n.datum_kreiranja)
       ORDER BY datum ASC`
    );

    // Formatiraj podatke za Google Charts - Profit po danima
    const profitPoDanima: any[] = [['Datum', 'Profit']];
    rezultatProfitPoDanima.rows.forEach((red: any) => {
      profitPoDanima.push([
        new Date(red.datum).toLocaleDateString('sr-RS'),
        parseFloat(String(red.profit)) || 0,
      ]);
    });

    // 2. Uzmi top 5 najprofitabilnijih proizvoda
    const rezultatTop5Proizvodi = await query(
      `SELECT 
        p.naziv,
        SUM((p.prodajna_cena - p.nabavna_cena) * sn.kolicina) as profit,
        SUM(sn.kolicina) as ukupnoProdata
       FROM narudzbenica n
       JOIN stavka_narudzbenice sn ON n.id_narudzbenica = sn.narudzbenica_id
       JOIN proizvod p ON sn.proizvod_id = p.id_proizvod
       WHERE n.tip = 'PRODAJA'
         AND n.status = 'ZAVRSENA'
       GROUP BY p.id_proizvod, p.naziv
       ORDER BY profit DESC
       LIMIT 5`
    );

    // Formatiraj podatke za Google Charts - Top 5 proizvodi
    const top5Proizvodi: any[] = [['Proizvod', 'Profit']];
    rezultatTop5Proizvodi.rows.forEach((red: any) => {
      top5Proizvodi.push([red.naziv, parseFloat(String(red.profit)) || 0]);
    });

    // 3. Izračunaj ukupan profit
    const rezultatUkupniProfit = await query(
      `SELECT SUM((p.prodajna_cena - p.nabavna_cena) * sn.kolicina) as ukupniProfit
       FROM narudzbenica n
       JOIN stavka_narudzbenice sn ON n.id_narudzbenica = sn.narudzbenica_id
       JOIN proizvod p ON sn.proizvod_id = p.id_proizvod
       WHERE n.tip = 'PRODAJA'
         AND n.status = 'ZAVRSENA'`
    );

    const ukupniProfit = rezultatUkupniProfit.rows[0]?.ukupniprofit != null
      ? parseFloat(String(rezultatUkupniProfit.rows[0].ukupniprofit))
      : 0;

    // 4. Vrati kompletan odgovor
    const odgovor = {
      profitPoDanima,
      top5Proizvodi,
      ukupniProfit,
      datumIzvestaja: new Date().toISOString(),
    };

    return addCorsHeaders(req, NextResponse.json(odgovor));
  } catch (greska: any) {
    console.error('Greška u analitici profita:', greska.message);
    return addCorsHeaders(
      req,
      NextResponse.json({ error: greska.message }, { status: 500 })
    );
  }
}
