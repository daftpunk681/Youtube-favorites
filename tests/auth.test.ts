import { describe, it, expect } from "vitest";
import { scryptSync } from "node:crypto";
import { SignJWT } from "jose";
import { verifyPassword } from "@/lib/password";
import { signSession, verifySession } from "@/lib/session-token";
const secret = "test-secret-for-unit-tests-only-1234567890";
describe("Authentification", () => {
  it("compare un mot de passe à son empreinte scrypt", () => {
    const salt = "1234567890abcdef1234567890abcdef";
    const hash = `scrypt:${salt}:${scryptSync("correct-password", salt, 64).toString("hex")}`;
    expect(verifyPassword("correct-password", hash)).toBe(true);
    expect(verifyPassword("incorrect", hash)).toBe(false);
    expect(verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(verifyPassword("x".repeat(1025), hash)).toBe(false);
  });
  it("signe une session valide et refuse une autre clé ou une altération", async () => {
    const token = await signSession(secret);
    expect(await verifySession(token, secret)).toBe(true);
    expect(
      await verifySession(token, "wrong-secret-1234567890123456789012"),
    ).toBe(false);
    expect(await verifySession(token + "broken", secret)).toBe(false);
    expect(await verifySession(token, "short")).toBe(false);
  });
  it("refuse une session expirée ou destinée à un autre service", async () => {
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuer("youtube-favorites")
      .setAudience("admin")
      .setExpirationTime("1 second ago")
      .sign(new TextEncoder().encode(secret));
    expect(await verifySession(token, secret)).toBe(false);
    const other = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuer("other")
      .setAudience("admin")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(secret));
    expect(await verifySession(other, secret)).toBe(false);
  });
});
