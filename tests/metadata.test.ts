import { afterEach, describe, it, expect, vi } from "vitest";
import { fetchVideoMetadata } from "@/lib/metadata";
afterEach(() => vi.unstubAllGlobals());
describe("Métadonnées gratuites sans clé", () => {
  it("récupère le titre en utilisant uniquement le domaine officiel", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Une vidéo",
          author_name: "Une chaîne",
          thumbnail_url: "https://evil.test/track",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    const result = await fetchVideoMetadata("LXb3EKWsInQ");
    expect(result).toMatchObject({
      title: "Une vidéo",
      author: "Une chaîne",
      available: true,
      thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    });
    expect(String(fetch.mock.calls[0][0])).toContain(
      "https://www.youtube.com/oembed?",
    );
  });
  it.each(["unavailable", "timeout", "invalid"])(
    "prévoit un repli si %s",
    async (mode) => {
      vi.stubGlobal(
        "fetch",
        mode === "timeout"
          ? vi.fn().mockRejectedValue(new Error("timeout"))
          : vi
              .fn()
              .mockResolvedValue(
                mode === "invalid"
                  ? new Response("{broken")
                  : new Response("", { status: 404 }),
              ),
      );
      expect(await fetchVideoMetadata("LXb3EKWsInQ")).toMatchObject({
        title: "",
        available: false,
      });
    },
  );
});
