import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleOptions } from "@/lib/cors";
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function POST() {
  const response = NextResponse.json(
    { message: "Uspešno ste se odjavili" },
    { status: 200 }
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
