import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kljuc_za_jwt_token'
);

export async function verifyAuth(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1] ||
                  req.cookies.get('token')?.value;
    
    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload;
  } catch (err) {
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return null;
  }
  return auth;
}
