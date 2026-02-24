import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { addCorsHeaders, handleOptions } from '@/lib/cors';
import { getLowStockProducts, sendLowStockNotification } from '@/lib/slanjeMejla';

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

const DOZVOLJENE_ULOGE = ['VLASNIK', 'RADNIK'];

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
