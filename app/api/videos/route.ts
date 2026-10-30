import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, readJson, apiError } from "@/lib/api";
import { videoInputSchema } from "@/lib/youtube";
import { saveVideo } from "@/lib/db";
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const input = videoInputSchema.parse(await readJson(request));
    const id = await saveVideo(input);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
