import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { demoLibrary } from "../lib/demo.ts";
const db = new PGlite();
await db.exec(
  await readFile(new URL("../db/001_initial.sql", import.meta.url), "utf8"),
);
async function reset() {
  await db.exec(
    "TRUNCATE video_categories,videos,categories,login_attempts CASCADE",
  );
  for (const category of demoLibrary.categories)
    await db.query("INSERT INTO categories(id,name,color) VALUES($1,$2,$3)", [
      category.id,
      category.name,
      category.color,
    ]);
  for (const video of demoLibrary.videos) {
    await db.query(
      "INSERT INTO videos(id,youtube_id,title,author,notes,featured,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        video.id,
        video.youtubeId,
        video.title,
        video.author,
        video.notes,
        video.featured,
        video.createdAt,
        video.updatedAt,
      ],
    );
    for (const category of video.categories)
      await db.query(
        "INSERT INTO video_categories(video_id,category_id) VALUES($1,$2)",
        [video.id, category],
      );
  }
}
await reset();
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    if (req.method === "POST" && req.url === "/__reset") {
      await reset();
      res.end("{}");
      return;
    }
    if (req.method !== "POST" || req.url !== "/sql") {
      res.writeHead(404);
      res.end("{}");
      return;
    }
    let body = "";
    for await (const chunk of req) body += chunk;
    const payload = JSON.parse(body);
    const queries = payload.queries ?? [payload];
    const descriptions = [];
    for (const query of queries)
      descriptions.push(await db.describeQuery(query.query));
    async function execute(query, description, tx = db) {
      const parsers = Object.fromEntries(
        description.resultFields.map((field) => [
          field.dataTypeID,
          (value) => value,
        ]),
      );
      const serializers = Object.fromEntries(
        description.queryParams.map((field) => [
          field.dataTypeID,
          (value) => value,
        ]),
      );
      return tx.query(query.query, query.params, {
        rowMode: "array",
        parsers,
        serializers,
      });
    }
    const result = payload.queries
      ? {
          results: await db.transaction(async (tx) => {
            const results = [];
            for (let i = 0; i < queries.length; i++)
              results.push(await execute(queries[i], descriptions[i], tx));
            return results;
          }),
        }
      : await execute(payload, descriptions[0]);
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error("Erreur SQL E2E :", error.code, error.message);
    res.writeHead(400);
    res.end(JSON.stringify({ message: error.message, code: error.code }));
  }
});
await new Promise((resolve) => server.listen(3101, "127.0.0.1", resolve));
const salt = "11111111111111111111111111111111";
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL:
        "postgresql://test:test@favorites-e2e.invalid/test?sslmode=require",
      ADMIN_PASSWORD_HASH: `scrypt:${salt}:${scryptSync("favorites-e2e-password", salt, 64).toString("hex")}`,
      SESSION_SECRET: "only-for-tests-session-secret-12345678901234567890",
      APP_URL: "http://localhost:3100",
      VERCEL: "0",
      YTF_E2E_BRIDGE: "1",
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --require ${fileURLToPath(new URL("./e2e-fetch.cjs", import.meta.url))}`,
    },
  },
);
async function close() {
  child.kill("SIGTERM");
  server.close();
  await db.close();
}
process.on("SIGTERM", () => {
  void close();
});
process.on("SIGINT", () => {
  void close();
});
child.on("exit", (code) => {
  server.close();
  void db.close();
  process.exitCode = code ?? 0;
});
