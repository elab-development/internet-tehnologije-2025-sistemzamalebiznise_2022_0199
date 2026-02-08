import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

const DOZVOLJENE_ULOGE = ["VLASNIK", "RADNIK", "DOSTAVLJAC"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ime = String(body?.ime ?? "").trim();
    const prezime = String(body?.prezime ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const lozinka = String(body?.lozinka ?? "");
    const uloga = String(body?.uloga ?? "").trim();

    if (!ime || !prezime || !email || !lozinka || !uloga) {
      return NextResponse.json(
        { error: "Obavezno: ime, prezime, email, lozinka, uloga" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Neispravan email" }, { status: 400 });
    }

    if (lozinka.length < 6) {
      return NextResponse.json(
        { error: "Lozinka mora imati najmanje 6 karaktera" },
        { status: 400 }
      );
    }

    if (!DOZVOLJENE_ULOGE.includes(uloga as any)) {
      return NextResponse.json({ error: "Neispravna uloga" }, { status: 400 });
    }

    const hashedLozinka = await bcrypt.hash(lozinka, 10);

    const result = await query(
      `INSERT INTO korisnik (ime, prezime, email, lozinka_hash, uloga)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_korisnik, ime, prezime, email, uloga`,
      [ime, prezime, email, hashedLozinka, uloga]
    );

    return NextResponse.json(
      { message: "Registrovan", user: result.rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Email je već u upotrebi" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
