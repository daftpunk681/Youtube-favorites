import "server-only";
export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
export function adminConfigured() {
  return (
    databaseConfigured() &&
    Boolean(
      process.env.SESSION_SECRET &&
      process.env.SESSION_SECRET.length >= 32 &&
      /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(
        process.env.ADMIN_PASSWORD_HASH ?? "",
      ),
    )
  );
}
