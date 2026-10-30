import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, readJson, apiError, ApiError } from "@/lib/api";
import { videoInputSchema, uuidSchema } from "@/lib/youtube";
import { saveVideo, database } from "@/lib/db";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);
    const id = uuidSchema.parse((await context.params).id);
    const input = videoInputSchema.parse(await readJson(request));
    if (!(await saveVideo(input, id)))
      throw new ApiError("Vidéo introuvable.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);
    const id = uuidSchema.parse((await context.params).id);
    const rows = await database().query(
      "DELETE FROM videos WHERE id=$1 RETURNING id",
      [id],
    );
    if (!rows.length) throw new ApiError("Vidéo introuvable.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
