import "server-only";
import { cookies } from "next/headers";
import { adminConfigured } from "./config";
import { signSession, verifySession, SESSION_DURATION } from "./session-token";
export const SESSION_COOKIE = "ytf_session";
export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return Boolean(
    token && (await verifySession(token, process.env.SESSION_SECRET!)),
  );
}
export async function createSession() {
  const token = await signSession(process.env.SESSION_SECRET!);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}
