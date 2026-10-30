import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAdmin } from "./auth";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assertOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected =
    process.env.APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : new URL(request.url).origin);
  if (!origin || origin !== new URL(expected).origin)
    throw new ApiError("Origine de la requête refusée.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new ApiError("Requête refusée.", 403);
}
export async function requireAdmin(request: NextRequest) {
  assertOrigin(request);
  if (!(await isAdmin()))
    throw new ApiError("Connectez-vous pour modifier votre collection.", 401);
}
export async function readJson(request: NextRequest) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError("Format JSON requis.", 415);
  // Limite effective même si Content-Length est absent ou mensonger.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Requête vide.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new ApiError("Requête trop volumineuse.", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError("JSON invalide.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "23505")
    return NextResponse.json(
      { error: "Cette vidéo ou ce nom de catégorie existe déjà." },
      { status: 409 },
    );
  if (code === "23503")
    return NextResponse.json(
      { error: "Une catégorie a été supprimée. Actualisez la page." },
      { status: 409 },
    );
  console.error("Échec d’une opération de la bibliothèque.");
  return NextResponse.json(
    {
      error: "Le service est temporairement indisponible. Réessayez plus tard.",
    },
    { status: 503 },
  );
}
