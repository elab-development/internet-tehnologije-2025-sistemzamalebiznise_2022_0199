import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from '@/lib/cors';
import { getLowStockProducts, sendLowStockNotification } from '@/lib/slanjeMejla';

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const DOZVOLJENE_ULOGE = ['VLASNIK', 'RADNIK'];

/**
 * @swagger
 * /api/lager/obavestenja:
 *   get:
 *     summary: Dohvati proizvode sa niskim lagerom
 *     description: Vraća proizvode čija je količina na lageru <= 5. VLASNIK i RADNIK imaju pristup.
 *     tags: [Lager]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Proizvodi sa niskim lagerom
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 threshold:
 *                   type: integer
 *                   example: 5
 *                 count:
 *                   type: integer
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       naziv:
 *                         type: string
 *                       kolicina_na_lageru:
 *                         type: integer
 *       401:
 *         description: Niste prijavljeni
 *       403:
 *         description: Nemate pristup
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 }));
    }

    const uloga = (auth as any).uloga;
    if (!DOZVOLJENE_ULOGE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Nemate pristup' }, { status: 403 }));
    }

    const products = await getLowStockProducts(5);
    return addCorsHeaders(
      req,
      NextResponse.json({
        threshold: 5,
        count: products.length,
        products,
      })
    );
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}

/**
 * @swagger
 * /api/lager/obavestenja:
 *   post:
 *     summary: Pošalji mejl upozorenje za nizak lager
 *     description: Šalje email obaveštenje vlasniku o proizvodima sa niskim zalihama.
 *     tags: [Lager]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Mejl uspešno poslat ili nema proizvoda sa niskim lagerom
 *       401:
 *         description: Niste prijavljeni
 *       403:
 *         description: Nemate pristup
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 }));
    }

    const uloga = (auth as any).uloga;
    if (!DOZVOLJENE_ULOGE.includes(uloga)) {
      return addCorsHeaders(req, NextResponse.json({ error: 'Nemate pristup' }, { status: 403 }));
    }

    const result = await sendLowStockNotification((auth as any).email);

    return addCorsHeaders(
      req,
      NextResponse.json({
        message: result.sent
          ? 'Mejl upozorenje je poslato vlasniku.'
          : result.reason,
        ...result,
      })
    );
  } catch (error: any) {
    return addCorsHeaders(req, NextResponse.json({ error: error.message }, { status: 500 }));
  }
}
