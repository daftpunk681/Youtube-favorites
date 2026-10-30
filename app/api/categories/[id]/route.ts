import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, readJson, apiError, ApiError } from "@/lib/api";
import { categoryInputSchema, uuidSchema } from "@/lib/youtube";
import { database } from "@/lib/db";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);
    const id = uuidSchema.parse((await context.params).id);
    const { name, color } = categoryInputSchema.parse(await readJson(request));
    const [category] = await database().query(
      "UPDATE categories SET name=$2,color=$3 WHERE id=$1 RETURNING id,name,color",
      [id, name, color],
    );
    if (!category) throw new ApiError("Catégorie introuvable.", 404);
    return NextResponse.json(category);
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: NextRequest, context: Context) {
  try {
    await requireAdmin(request);
    const id = uuidSchema.parse((await context.params).id);
    const rows = await database().query(
      "DELETE FROM categories WHERE id=$1 RETURNING id",
      [id],
    );
    if (!rows.length) throw new ApiError("Catégorie introuvable.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
