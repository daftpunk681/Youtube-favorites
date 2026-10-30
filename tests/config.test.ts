import { afterEach, describe, it, expect, vi } from "vitest";
import { adminConfigured } from "@/lib/config";
vi.mock("@neondatabase/serverless", () => ({ neon: vi.fn() }));
import { neon } from "@neondatabase/serverless";
import { getLibrary } from "@/lib/db";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("Configuration et absence de service externe", () => {
  it("ferme l’administration si la base ou les secrets ne sont pas configurés", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("ADMIN_PASSWORD_HASH", "");
    vi.stubEnv("SESSION_SECRET", "");
    expect(adminConfigured()).toBe(false);
    vi.stubEnv("DATABASE_URL", "postgresql://test");
    vi.stubEnv(
      "ADMIN_PASSWORD_HASH",
      "scrypt:" + "1".repeat(32) + ":" + "a".repeat(128),
    );
    vi.stubEnv("SESSION_SECRET", "short");
    expect(adminConfigured()).toBe(false);
    vi.stubEnv("SESSION_SECRET", "s".repeat(32));
    expect(adminConfigured()).toBe(true);
  });
  it("affiche une démo explicite sans connexion et sans appeler Neon", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.mocked(neon).mockClear();
    const library = await getLibrary();
    expect(library.demo).toBe(true);
    expect(library.videos.length).toBeGreaterThan(0);
    expect(neon).not.toHaveBeenCalled();
  });
  it("signale une panne de la base sans remplacer les données réelles par une démo", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test");
    vi.mocked(neon).mockImplementation(() => {
      throw new Error("test connection error");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getLibrary()).toEqual({
      videos: [],
      categories: [],
      demo: false,
      unavailable: true,
    });
  });
});
