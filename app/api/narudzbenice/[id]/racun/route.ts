import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from '@/lib/cors';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtCurrency(val: number): string {
  return Number(val).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * @swagger
 * /api/narudzbenice/{id}/racun:
 *   get:
 *     summary: Generiši PDF račun
 *     description: Generiše PDF račun za završenu PRODAJU narudžbenicu. Račun sadrži podatke o stavkama, cenama i ukupnom iznosu.
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
 *         description: PDF račun
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Račun je dostupan samo za PRODAJU u statusu ZAVRSENA
 *       401:
 *         description: Niste prijavljeni
 *       404:
 *         description: Narudžbenica nije pronađena
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 }));
    }

    const { id } = await params;
    const orderId = Number(id);
    if (!Number.isFinite(orderId)) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Neispravan ID' }, { status: 400 }));
    }

    const orderRes = await query(
      `SELECT
        n.id_narudzbenica, n.datum_kreiranja, n.datum_zavrsetka,
        n.tip, n.status, n.ukupna_vrednost, n.napomena,
        k.ime || ' ' || k.prezime AS kreirao_ime,
        k.email AS kreirao_email
      FROM narudzbenica n
      LEFT JOIN korisnik k ON n.kreirao_id = k.id_korisnik
      WHERE n.id_narudzbenica = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Narudzbenica nije pronadjena' }, { status: 404 }));
    }

    const order = orderRes.rows[0];

    if (order.tip !== 'PRODAJA') {
      return addCorsHeaders(req, NextResponse.json({ error: 'Racun je dostupan samo za PRODAJU' }, { status: 400 }));
    }
    if (order.status !== 'ZAVRSENA') {
      return addCorsHeaders(req, NextResponse.json({ error: 'Racun je dostupan samo za zavrsene narudzbenice' }, { status: 400 }));
    }

    const itemsRes = await query(
      `SELECT
        p.naziv AS proizvod_naziv,
        p.sifra AS proizvod_sifra,
        sn.kolicina,
        COALESCE(sn.prodajna_cena, p.prodajna_cena) AS cena,
        sn.ukupna_cena
      FROM stavka_narudzbenice sn
      JOIN proizvod p ON sn.proizvod_id = p.id_proizvod
      WHERE sn.narudzbenica_id = $1
      ORDER BY sn.id_stavka`,
      [orderId]
    );

    const stavke = itemsRes.rows;

    // ===== Generisanje PDF-a pomocu pdf-lib =====
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`Racun #${order.id_narudzbenica}`);
    pdfDoc.setAuthor('ShopScale Buddy');

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // --- ZAGLAVLJE ---
    const titleText = 'RACUN';
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 24);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: y - 24,
      size: 24,
      font: helveticaBold,
      color: rgb(0.13, 0.13, 0.13),
    });
    y -= 45;

    const subtitleText = 'ShopScale Buddy - Sistem za male biznise';
    const subtitleWidth = helvetica.widthOfTextAtSize(subtitleText, 10);
    page.drawText(subtitleText, {
      x: (width - subtitleWidth) / 2,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 20;

    // Linija
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 30;

    // --- PODACI O RACUNU ---
    const drawLabel = (text: string, x: number, yPos: number) => {
      page.drawText(text, { x, y: yPos, size: 10, font: helveticaBold, color: rgb(0, 0, 0) });
    };
    const drawValue = (text: string, x: number, yPos: number) => {
      page.drawText(text, { x, y: yPos, size: 10, font: helvetica, color: rgb(0, 0, 0) });
    };

    drawLabel('Broj racuna:', margin, y);
    drawValue(`#${order.id_narudzbenica}`, margin + 120, y);
    drawLabel('Izdao:', 350, y);
    drawValue(order.kreirao_ime || '—', 400, y);
    y -= 18;

    drawLabel('Datum kreiranja:', margin, y);
    drawValue(formatDate(order.datum_kreiranja), margin + 120, y);
    drawLabel('Email:', 350, y);
    drawValue(order.kreirao_email || '—', 400, y);
    y -= 18;

    if (order.datum_zavrsetka) {
      drawLabel('Datum zavrsavanja:', margin, y);
      drawValue(formatDate(order.datum_zavrsetka), margin + 120, y);
      y -= 18;
    }

    y -= 20;

    // --- TABELA ---
    // Linija iznad zaglavlja
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;

    // Zaglavlje tabele
    const cols = {
      num: margin,
      naziv: margin + 30,
      sifra: margin + 230,
      cena: margin + 320,
      kol: margin + 390,
      ukupno: margin + 430,
    };

    page.drawText('#', { x: cols.num, y, size: 9, font: helveticaBold });
    page.drawText('Naziv proizvoda', { x: cols.naziv, y, size: 9, font: helveticaBold });
    page.drawText('Sifra', { x: cols.sifra, y, size: 9, font: helveticaBold });
    page.drawText('Cena', { x: cols.cena, y, size: 9, font: helveticaBold });
    page.drawText('Kol.', { x: cols.kol, y, size: 9, font: helveticaBold });
    page.drawText('Ukupno', { x: cols.ukupno, y, size: 9, font: helveticaBold });

    y -= 8;

    // Linija ispod zaglavlja
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.67, 0.67, 0.67),
    });
    y -= 16;

    // Stavke
    stavke.forEach((s: any, i: number) => {
      // Naizmenicna boja pozadine
      if (i % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: y - 3,
          width: contentWidth,
          height: 16,
          color: rgb(0.96, 0.96, 0.96),
        });
      }

      page.drawText(`${i + 1}`, { x: cols.num, y, size: 9, font: helvetica });
      // Skrati naziv ako je predugacak
      let naziv = String(s.proizvod_naziv);
      if (helvetica.widthOfTextAtSize(naziv, 9) > 195) {
        while (helvetica.widthOfTextAtSize(naziv + '...', 9) > 195 && naziv.length > 0) {
          naziv = naziv.slice(0, -1);
        }
        naziv += '...';
      }
      page.drawText(naziv, { x: cols.naziv, y, size: 9, font: helvetica });
      page.drawText(String(s.proizvod_sifra), { x: cols.sifra, y, size: 9, font: helvetica });
      page.drawText(fmtCurrency(s.cena), { x: cols.cena, y, size: 9, font: helvetica });
      page.drawText(`${s.kolicina}`, { x: cols.kol, y, size: 9, font: helvetica });
      page.drawText(fmtCurrency(s.ukupna_cena), { x: cols.ukupno, y, size: 9, font: helvetica });

      y -= 18;
    });

    // Linija ispod stavki
    y -= 4;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 28;

    // --- UKUPAN IZNOS ---
    const totalText = `UKUPNO: ${fmtCurrency(order.ukupna_vrednost)} RSD`;
    const totalWidth = helveticaBold.widthOfTextAtSize(totalText, 14);
    page.drawText(totalText, {
      x: width - margin - totalWidth,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 50;

    // --- FOOTER ---
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.67, 0.67, 0.67),
    });
    y -= 16;

    const footerDate = `Dokument generisan: ${new Date().toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const footerDateW = helvetica.widthOfTextAtSize(footerDate, 8);
    page.drawText(footerDate, {
      x: (width - footerDateW) / 2,
      y,
      size: 8,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6),
    });
    y -= 14;

    const footerApp = 'ShopScale Buddy — automatski generisan racun';
    const footerAppW = helvetica.widthOfTextAtSize(footerApp, 8);
    page.drawText(footerApp, {
      x: (width - footerAppW) / 2,
      y,
      size: 8,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Serijalizuj PDF
    const pdfBytes = await pdfDoc.save();

    const response = new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="racun_${orderId}.pdf"`,
      },
    });

    return addCorsHeaders(req, response);
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
