import { describe, it, expect } from "vitest";
import { demoLibrary } from "@/lib/demo";
import {
  parseYouTubeUrl,
  videoInputSchema,
  categoryInputSchema,
} from "@/lib/youtube";
describe("URL YouTube", () => {
  it("utilise des identifiants valides dans la démonstration", () => {
    for (const video of demoLibrary.videos)
      expect(parseYouTubeUrl("https://youtu.be/" + video.youtubeId)).toBe(
        video.youtubeId,
      );
  });
  it.each([
    "https://www.youtube.com/watch?v=LXb3EKWsInQ&t=32",
    "https://youtu.be/LXb3EKWsInQ?si=abc",
    "https://youtube.com/shorts/LXb3EKWsInQ",
    "https://m.youtube.com/live/LXb3EKWsInQ",
    "https://www.youtube-nocookie.com/embed/LXb3EKWsInQ",
    "https://music.youtube.com/watch?v=LXb3EKWsInQ",
  ])("accepte %s", (url) => expect(parseYouTubeUrl(url)).toBe("LXb3EKWsInQ"));
  it.each([
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=LXb3EKWsInQ",
    "https://evil.test/?v=LXb3EKWsInQ",
    "https://youtube.com@evil.test/watch?v=LXb3EKWsInQ",
    "https://youtube.com/watch?v=invalid",
    "https://youtube.com/playlist?list=PL123",
    "https://youtube.com:8443/watch?v=LXb3EKWsInQ",
    "file:///etc/passwd",
    "",
    "https://youtu.be/../../localhost",
  ])("refuse %s", (url) => expect(parseYouTubeUrl(url)).toBeNull());
  it("déduplique les catégories et rejette un titre vide", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      videoInputSchema.parse({
        url: "https://youtu.be/LXb3EKWsInQ",
        title: "  Test  ",
        categories: [id, id],
      }),
    ).toMatchObject({ title: "Test", categories: [id], featured: false });
    expect(
      videoInputSchema.safeParse({
        url: "https://youtu.be/LXb3EKWsInQ",
        title: "  ",
      }).success,
    ).toBe(false);
    expect(
      categoryInputSchema.safeParse({ name: "Test", color: "red<script>" })
        .success,
    ).toBe(false);
  });
});
