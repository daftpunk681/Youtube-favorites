import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, readJson, apiError, ApiError } from "@/lib/api";
import { parseYouTubeUrl } from "@/lib/youtube";
import { fetchVideoMetadata } from "@/lib/metadata";
import { z } from "zod";
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { url } = z
      .object({ url: z.string().max(2048) })
      .parse(await readJson(request));
    const id = parseYouTubeUrl(url);
    if (!id) throw new ApiError("Collez une URL YouTube valide.");
    return NextResponse.json(await fetchVideoMetadata(id));
  } catch (error) {
    return apiError(error);
  }
}
