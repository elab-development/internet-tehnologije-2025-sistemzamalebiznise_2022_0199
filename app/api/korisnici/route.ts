// app/api/korisnici/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((user as any).uloga !== "VLASNIK") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await query(
      `
      SELECT
        id_korisnik AS "idKorisnik",
        ime,
        prezime,
        email,
        uloga
      FROM korisnik
      ORDER BY id_korisnik DESC
      `
    );

    return NextResponse.json({ korisnici: result.rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
