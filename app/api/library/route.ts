import { NextResponse } from "next/server";
import { getLibrary } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const library = await getLibrary();
  return NextResponse.json(library, {
    status: library.unavailable ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
