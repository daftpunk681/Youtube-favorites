import { afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/auth", () => ({ isAdmin: vi.fn().mockResolvedValue(false) }));
vi.mock("@/lib/db", () => ({ database: vi.fn(), saveVideo: vi.fn() }));
import { assertOrigin, readJson } from "@/lib/api";
import { POST as createVideo } from "@/app/api/videos/route";
import {
  PATCH as updateVideo,
  DELETE as deleteVideo,
} from "@/app/api/videos/[id]/route";
import { POST as createCategory } from "@/app/api/categories/route";
import {
  PATCH as updateCategory,
  DELETE as deleteCategory,
} from "@/app/api/categories/[id]/route";
import { POST as metadata } from "@/app/api/videos/metadata/route";
import { database, saveVideo } from "@/lib/db";
const origin = "http://localhost:3000";
function request(path: string, method = "POST", body = "{}") {
  return new NextRequest(origin + path, {
    method,
    headers: { origin, "content-type": "application/json" },
    body,
  });
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("Protection des API", () => {
  it("bloque les écritures et les métadonnées sans session, avant tout accès à la base", async () => {
    const context = {
      params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }),
    };
    const responses = await Promise.all([
      createVideo(request("/api/videos")),
      updateVideo(request("/api/videos/id", "PATCH"), context),
      deleteVideo(request("/api/videos/id", "DELETE"), context),
      createCategory(request("/api/categories")),
      updateCategory(request("/api/categories/id", "PATCH"), context),
      deleteCategory(request("/api/categories/id", "DELETE"), context),
      metadata(request("/api/videos/metadata")),
    ]);
    expect(responses.every((r) => r.status === 401)).toBe(true);
    expect(database).not.toHaveBeenCalled();
    expect(saveVideo).not.toHaveBeenCalled();
  });
  it("refuse les origines étrangères et les requêtes sans origine", () => {
    vi.stubEnv("APP_URL", origin);
    expect(() =>
      assertOrigin(
        new NextRequest(origin + "/api/videos", {
          headers: { origin: "https://attacker.test" },
        }),
      ),
    ).toThrow("Origine");
    expect(() => assertOrigin(new NextRequest(origin + "/api/videos"))).toThrow(
      "Origine",
    );
    expect(() => assertOrigin(request("/api/videos"))).not.toThrow();
  });
  it("limite le corps JSON même sans Content-Length", async () => {
    await expect(
      readJson(
        request(
          "/api/videos",
          "POST",
          JSON.stringify({ notes: "x".repeat(17000) }),
        ),
      ),
    ).rejects.toThrow("volumineuse");
    await expect(
      readJson(request("/api/videos", "POST", "bad-json")),
    ).rejects.toThrow("JSON invalide");
  });
});
