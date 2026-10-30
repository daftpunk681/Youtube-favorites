import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, readJson, apiError } from "@/lib/api";
import { categoryInputSchema } from "@/lib/youtube";
import { database } from "@/lib/db";
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { name, color } = categoryInputSchema.parse(await readJson(request));
    const [category] = await database().query(
      "INSERT INTO categories(name,color) VALUES($1,$2) RETURNING id,name,color",
      [name, color],
    );
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
