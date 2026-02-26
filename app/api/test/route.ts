import { NextRequest, NextResponse } from "next/server";
import { addCorsHeaders, handleOptions } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint
 *     description: Returns a simple test response.
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Test response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function GET(req: NextRequest) {
  return addCorsHeaders(req, NextResponse.json({ message: "API radi!" }, { status: 200 }));
}
