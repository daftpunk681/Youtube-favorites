import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { assertOrigin, apiError } from "@/lib/api";
export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    (await cookies()).delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
