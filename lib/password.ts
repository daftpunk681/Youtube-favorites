import { scryptSync, timingSafeEqual } from "node:crypto";
export function verifyPassword(password: string, encoded: string): boolean {
  if (
    !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded) ||
    password.length > 1024
  )
    return false;
  const [, salt, hash] = encoded.split(":");
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
