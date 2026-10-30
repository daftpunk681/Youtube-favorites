import type { Video } from "./types";
export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}
export function filterVideos(
  videos: Video[],
  options: { query: string; category: string; featured: boolean; sort: string },
) {
  const query = normalize(options.query.trim());
  return videos
    .filter(
      (v) =>
        (!options.featured || v.featured) &&
        (options.category === "all" ||
          v.categories.includes(options.category)) &&
        (!query ||
          normalize(`${v.title} ${v.author} ${v.notes}`).includes(query)),
    )
    .sort((a, b) =>
      options.sort === "title"
        ? a.title.localeCompare(b.title, "fr")
        : options.sort === "oldest"
          ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
          : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
}
