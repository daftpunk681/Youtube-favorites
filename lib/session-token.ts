import { SignJWT, jwtVerify } from "jose";
export const SESSION_DURATION = 8 * 60 * 60;
export async function signSession(secret: string) {
  if (secret.length < 32) throw new Error("SESSION_SECRET_TOO_SHORT");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuer("youtube-favorites")
    .setAudience("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(new TextEncoder().encode(secret));
}
export async function verifySession(
  token: string,
  secret: string,
): Promise<boolean> {
  if (secret.length < 32) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"], issuer: "youtube-favorites", audience: "admin" },
    );
    return payload.sub === "admin" && payload.role === "admin";
  } catch {
    return false;
  }
}
