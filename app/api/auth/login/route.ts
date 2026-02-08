import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = String(body?.email ?? "").trim().toLowerCase();
    const lozinka = String(body?.lozinka ?? "");

    if (!email || !lozinka) {
      return NextResponse.json(
        { error: "Email i lozinka su obavezni" },
        { status: 400 }
      );
    }

    const result = await query(
      "SELECT * FROM korisnik WHERE email = $1 LIMIT 1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      );
    }

    const lozinkaTacna = await bcrypt.compare(lozinka, user.lozinka_hash);
    if (!lozinkaTacna) {
      return NextResponse.json(
        { error: "Pogrešan email ili lozinka" },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || "kljuc_za_jwt_token";

    const token = jwt.sign(
      { userId: user.id_korisnik, email: user.email, uloga: user.uloga },
      jwtSecret,
      { expiresIn: "24h" }
    );

    const response = NextResponse.json(
      {
        message: "Uspešna prijava",
        user: {
          id_korisnik: user.id_korisnik,
          ime: user.ime,
          prezime: user.prezime,
          email: user.email,
          uloga: user.uloga,
        },
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
