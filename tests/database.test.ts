import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import {
  createVideoQuery,
  updateVideoQuery,
  videosQuery,
  loginAttemptQuery,
} from "@/lib/queries";
let db: PGlite;
let first: string;
let second: string;
let video: string;
beforeAll(async () => {
  db = new PGlite();
  const source = await readFile("db/001_initial.sql", "utf8");
  await db.exec(source);
  await db.exec(source);
  first = (
    await db.query<{ id: string }>(
      "INSERT INTO categories(name) VALUES('Nature') RETURNING id",
    )
  ).rows[0].id;
  second = (
    await db.query<{ id: string }>(
      "INSERT INTO categories(name,color) VALUES('Voyage','orange') RETURNING id",
    )
  ).rows[0].id;
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe.sequential(
  "PostgreSQL persistant : contraintes et opérations atomiques",
  () => {
    it("crée une vidéo associée à plusieurs catégories", async () => {
      video = (
        await db.query<{ id: string }>(createVideoQuery, [
          "LXb3EKWsInQ",
          "Costa Rica",
          "Auteur",
          "Note",
          true,
          [first, second],
        ])
      ).rows[0].id;
      const rows = (await db.query<{ categories: string[] }>(videosQuery)).rows;
      expect(rows).toHaveLength(1);
      expect(rows[0].categories.sort()).toEqual([first, second].sort());
    });
    it("refuse les doublons de vidéo et de catégorie sans modifier les données", async () => {
      await expect(
        db.query(createVideoQuery, [
          "LXb3EKWsInQ",
          "Doublon",
          "",
          "",
          false,
          [],
        ]),
      ).rejects.toThrow();
      await expect(
        db.query("INSERT INTO categories(name) VALUES('nature')"),
      ).rejects.toThrow();
      expect((await db.query(videosQuery)).rows).toHaveLength(1);
    });
    it("met à jour les champs et remplace les associations", async () => {
      await db.query(updateVideoQuery, [
        video,
        "LXb3EKWsInQ",
        "Nouveau titre",
        "Chaîne",
        "Nouvelle note",
        false,
        [second],
      ]);
      const row = (
        await db.query<{
          title: string;
          featured: boolean;
          categories: string[];
        }>(videosQuery)
      ).rows[0];
      expect(row).toMatchObject({
        title: "Nouveau titre",
        featured: false,
        categories: [second],
      });
    });
    it("annule toute la modification si une catégorie est invalide", async () => {
      await expect(
        db.query(updateVideoQuery, [
          video,
          "LXb3EKWsInQ",
          "Ne pas enregistrer",
          "",
          "",
          true,
          ["00000000-0000-4000-8000-000000000000"],
        ]),
      ).rejects.toThrow();
      expect(
        (await db.query<{ title: string; categories: string[] }>(videosQuery))
          .rows[0],
      ).toMatchObject({ title: "Nouveau titre", categories: [second] });
    });
    it("retire une catégorie en conservant la vidéo", async () => {
      await db.query("DELETE FROM categories WHERE id=$1", [second]);
      expect(
        (await db.query<{ categories: string[] }>(videosQuery)).rows[0]
          .categories,
      ).toEqual([]);
    });
    it("enregistre les quotas de connexion dans la base et réinitialise la fenêtre", async () => {
      for (let i = 1; i <= 9; i++) {
        const result = await db.query<{ attempts: number }>(loginAttemptQuery, [
          "abc",
        ]);
        expect(result.rows[0].attempts).toBe(i);
      }
      await db.query(
        "UPDATE login_attempts SET window_start=now()-interval '16 minutes' WHERE key_hash='abc'",
      );
      expect(
        (await db.query<{ attempts: number }>(loginAttemptQuery, ["abc"]))
          .rows[0].attempts,
      ).toBe(1);
    });
    it("supprime une vidéo et ses associations", async () => {
      await db.query(
        "INSERT INTO video_categories(video_id,category_id) VALUES($1,$2)",
        [video, first],
      );
      await db.query("DELETE FROM videos WHERE id=$1", [video]);
      expect((await db.query(videosQuery)).rows).toHaveLength(0);
      expect(
        (await db.query("SELECT * FROM video_categories")).rows,
      ).toHaveLength(0);
    });
  },
);
