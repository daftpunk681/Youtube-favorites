import { describe, it, expect } from "vitest";
import { filterVideos } from "@/lib/filter";
import { demoLibrary } from "@/lib/demo";
const options = { query: "", category: "all", featured: false, sort: "newest" };
describe("Recherche et filtres", () => {
  it("cherche sans distinction de casse ni accents dans les titres et notes", () => {
    expect(
      filterVideos(demoLibrary.videos, { ...options, query: "  COEUR  " }),
    ).toHaveLength(1);
    expect(
      filterVideos(demoLibrary.videos, { ...options, query: "outils libres" }),
    ).toHaveLength(1);
  });
  it("combine catégorie et mise en avant", () => {
    expect(
      filterVideos(demoLibrary.videos, {
        ...options,
        category: demoLibrary.categories[1].id,
        featured: true,
      }),
    ).toHaveLength(1);
  });
  it("trie sans modifier la collection originale", () => {
    const original = [...demoLibrary.videos];
    const sorted = filterVideos(demoLibrary.videos, {
      ...options,
      sort: "oldest",
    });
    expect(sorted[0].youtubeId).toBe("dQw4w9WgXcQ");
    expect(demoLibrary.videos).toEqual(original);
  });
});
