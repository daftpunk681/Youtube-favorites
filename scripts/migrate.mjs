import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
if (!process.env.DATABASE_URL) {
  console.error(
    "Ajoutez DATABASE_URL dans .env.local, puis relancez npm run db:migrate.",
  );
  process.exit(1);
}
try {
  const sql = neon(process.env.DATABASE_URL);
  const source = await readFile(
    new URL("../db/001_initial.sql", import.meta.url),
    "utf8",
  );
  const statements = source
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(statements.map((statement) => sql.query(statement)));
  console.log(
    "Base de données prête. La migration peut être relancée sans supprimer vos données.",
  );
} catch {
  console.error(
    "Migration impossible. Vérifiez la connexion Neon, SSL et les droits du rôle PostgreSQL.",
  );
  process.exit(1);
}
