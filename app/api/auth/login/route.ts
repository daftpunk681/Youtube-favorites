import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminConfigured } from "@/lib/config";
import { createSession } from "@/lib/auth";
import { assertOrigin, readJson, apiError, ApiError } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { database } from "@/lib/db";
import { loginAttemptQuery } from "@/lib/queries";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    if (!adminConfigured())
      throw new ApiError(
        "L’administration doit être configurée sur le serveur.",
        503,
      );
    const { password } = z
      .object({ password: z.string().min(1).max(1024) })
      .parse(await readJson(request));
    // Vercel remplace cet en-tête. Hors Vercel, un quota global évite de faire confiance à une IP fournie par le client.
    const identity =
      process.env.VERCEL === "1"
        ? request.headers
            .get("x-vercel-forwarded-for")
            ?.split(",")[0]
            ?.trim() || "shared"
        : "shared";
    const key = createHmac("sha256", process.env.SESSION_SECRET!)
      .update(identity)
      .digest("hex");
    const [attempt] = await database().query(loginAttemptQuery, [key]);
    if (Number(attempt.attempts) > 8)
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(attempt.retry_after) },
        },
      );
    if (!verifyPassword(password, process.env.ADMIN_PASSWORD_HASH!))
      throw new ApiError("Mot de passe incorrect.", 401);
    await createSession();
    await database().query(
      "DELETE FROM login_attempts WHERE key_hash=$1 OR window_start < now() - interval '1 day'",
      [key],
    );
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
