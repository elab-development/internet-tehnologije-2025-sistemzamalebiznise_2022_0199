import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const DOZVOLJENE_ULOGE = ["VLASNIK", "RADNIK", "DOSTAVLJAC"];

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((authUser as any).uloga !== "VLASNIK") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params; // ✅ Next traži await
    const idStr = String(id ?? "").trim();

    if (!/^\d+$/.test(idStr)) {
      return NextResponse.json({ error: "Neispravan ID" }, { status: 400 });
    }
    const korisnikId = Number(idStr);

    let body: any = {};
    try {
      body = await req.json();
    } catch (err) {
    return NextResponse.json(
    { error: "Neispravan JSON body (pošalji npr. {\"uloga\":\"RADNIK\"})" },
    { status: 400 }
  );
}

    const uloga = String(body?.uloga ?? "").trim();

    if (!uloga) {
      return NextResponse.json({ error: "Moraš poslati uloga" }, { status: 400 });
    }

    if (!DOZVOLJENE_ULOGE.includes(uloga)) {
      return NextResponse.json({ error: "Neispravna uloga" }, { status: 400 });
    }

    const authId = Number((authUser as any).userId);
    if (korisnikId === authId) {
      return NextResponse.json(
        { error: "Ne možeš promeniti sopstvenu ulogu" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      UPDATE korisnik
      SET uloga = $1
      WHERE id_korisnik = $2
      RETURNING id_korisnik AS "idKorisnik", ime, prezime, email, uloga
      `,
      [uloga, korisnikId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Korisnik ne postoji" }, { status: 404 });
    }

    return NextResponse.json({ korisnik: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
