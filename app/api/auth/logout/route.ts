import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Odjava korisnika
 *     description: Briše JWT token cookie i odjavljuje korisnika.
 *     tags: [Autentifikacija]
 *     responses:
 *       200:
 *         description: Uspešna odjava
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Uspešno ste se odjavili
 */
export async function POST(req: NextRequest) {
  const response = NextResponse.json(
    { message: "Uspešno ste se odjavili" },
    { status: 200 }
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return addCorsHeaders(req, response);
}
