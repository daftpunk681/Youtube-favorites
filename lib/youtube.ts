import { z } from "zod";
const idPattern = /^[a-zA-Z0-9_-]{11}$/;
const hosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
export function parseYouTubeUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    let id: string | null = null;
    if (url.hostname === "youtu.be") id = url.pathname.split("/")[1];
    else if (hosts.has(url.hostname)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (/^\/(shorts|embed|live)\//.test(url.pathname))
        id = url.pathname.split("/")[2];
    }
    return id && idPattern.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function thumbnailUrl(id: string, high = false) {
  return `https://i.ytimg.com/vi/${id}/${high ? "maxresdefault" : "hqdefault"}.jpg`;
}
export function watchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}
export const videoInputSchema = z.object({
  url: z
    .string()
    .max(2048)
    .refine(
      (value) => parseYouTubeUrl(value) !== null,
      "Collez une URL YouTube valide.",
    ),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  author: z.string().trim().max(200).default(""),
  notes: z.string().trim().max(2000).default(""),
  featured: z.boolean().default(false),
  categories: z
    .array(z.uuid())
    .max(30)
    .transform((ids) => [...new Set(ids)])
    .default([]),
});
export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(40),
  color: z.enum(["teal", "orange", "purple", "blue", "rose"]).default("teal"),
});
export const uuidSchema = z.uuid();
