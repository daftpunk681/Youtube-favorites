import "server-only";
import { neon } from "@neondatabase/serverless";
import { databaseConfigured } from "./config";
import { demoLibrary } from "./demo";
import { videosQuery, createVideoQuery, updateVideoQuery } from "./queries";
import type { LibraryData, VideoInput, Category, Video } from "./types";
import { parseYouTubeUrl } from "./youtube";
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return neon(process.env.DATABASE_URL);
}
export async function getLibrary(): Promise<LibraryData> {
  if (!databaseConfigured()) return structuredClone(demoLibrary);
  try {
    const sql = database();
    const [videos, categories] = await Promise.all([
      sql.query(videosQuery),
      sql.query("SELECT id,name,color FROM categories ORDER BY lower(name)"),
    ]);
    return {
      videos: videos as Video[],
      categories: categories as Category[],
      demo: false,
    };
  } catch {
    console.error(
      "Bibliothèque indisponible : vérifier la connexion et les migrations PostgreSQL.",
    );
    return { videos: [], categories: [], demo: false, unavailable: true };
  }
}
export async function saveVideo(input: VideoInput, id?: string) {
  const values = [
    parseYouTubeUrl(input.url),
    input.title,
    input.author,
    input.notes,
    input.featured,
    input.categories,
  ];
  const result = await database().query(
    id ? updateVideoQuery : createVideoQuery,
    id ? [id, ...values] : values,
  );
  return result[0]?.id as string | undefined;
}
