import { test, expect, type Page } from "@playwright/test";
async function login(page: Page) {
  await page.goto("/admin");
  await page
    .getByLabel("Mot de passe administrateur")
    .fill("favorites-e2e-password");
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(page.getByText("Mode administration")).toBeVisible();
}
test.beforeEach(async ({ request, page }) => {
  await request.post("http://127.0.0.1:3101/__reset");
  await page.route("https://i.ytimg.com/**", (route) => route.abort());
});
test("accueil, recherche sans accents, filtres, tri et lecteur à la demande", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Les bonnes vidéos, au bon endroit." }),
  ).toBeVisible();
  await expect(page.locator(".video-card")).toHaveCount(6);
  await expect(page.locator(".hero-card > img")).toHaveCount(0);
  await page
    .locator(".card-watch > img")
    .evaluateAll((images) =>
      images.forEach(
        (image) => ((image as HTMLImageElement).loading = "eager"),
      ),
    );
  await expect(page.locator(".card-watch > img")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("accueil-bureau.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("textbox", { name: "Rechercher une vidéo" })
    .fill("COEUR");
  await expect(page.locator(".video-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Effacer la recherche" }).click();
  await page.getByRole("button", { name: "Filtrer", exact: true }).click();
  await page
    .getByLabel("Catégorie", { exact: true })
    .selectOption("33333333-3333-4333-8333-333333333333");
  await expect(page.locator(".video-card")).toHaveCount(2);
  await page.getByLabel("À la une uniquement").check();
  await expect(page.locator(".video-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Réinitialiser", exact: true })
    .click();
  await page.getByLabel("Trier les vidéos").selectOption("title");
  await expect(page.locator(".video-card").first()).toContainText(
    "Big Buck Bunny",
  );
  await page
    .getByRole("button", {
      name: "Regarder Big Buck Bunny : la magie de l’animation",
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      status: 200,
      body: "<html>Lecteur de test</html>",
      contentType: "text/html",
    }),
  );
  await page.getByRole("button", { name: "Lancer la vidéo" }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("navigation mobile, clavier et absence de débordement horizontal", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("button", { name: "Ma collection" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Toutes vos découvertes." }),
  ).toBeVisible();
  await expect(page.locator(".sidebar")).not.toHaveClass(/sidebar-open/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".card-watch > img")
    .evaluateAll((images) =>
      images.forEach(
        (image) => ((image as HTMLImageElement).loading = "eager"),
      ),
    );
  await expect(page.locator(".card-watch > img")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("collection-mobile.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Regarder Never Gonna Give You Up" })
    .click();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("dialog").locator(":focus")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("les routes refusent les écritures et origines étrangères sans exposer de secret", async ({
  request,
  page,
}) => {
  const response = await request.post("/api/videos", {
    headers: { Origin: "http://localhost:3100" },
    data: {},
  });
  expect(response.status()).toBe(401);
  const csrf = await request.post("/api/auth/login", {
    headers: { Origin: "https://attacker.test" },
    data: { password: "favorites-e2e-password" },
  });
  expect(csrf.status()).toBe(403);
  await page.goto("/");
  const content = await page.content();
  expect(content).not.toContain("only-for-tests-session-secret");
  expect(content).not.toContain("scrypt:");
  expect(content).not.toContain("postgresql://");
});
test("connexion, catégories, ajout, persistance entre appareils, édition et suppression", async ({
  page,
  browser,
  request,
}) => {
  await page.goto("/admin");
  await page.getByLabel("Mot de passe administrateur").fill("incorrect");
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(page.getByText("Mot de passe incorrect.")).toBeVisible();
  await page
    .getByLabel("Mot de passe administrateur")
    .fill("favorites-e2e-password");
  await page.getByRole("button", { name: "Entrer dans mon espace" }).click();
  await expect(page.getByText("Mode administration")).toBeVisible();
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === "ytf_session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  await page
    .getByRole("button", { name: "Gérer les catégories", exact: true })
    .last()
    .click();
  await page.getByLabel("Nom de la catégorie").fill("Découvertes");
  await page.getByRole("radio", { name: "Rose", exact: true }).check();
  await page
    .getByRole("button", { name: "Créer la catégorie", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Découvertes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Renommer Découvertes" }).click();
  await page.getByLabel("Nom de la catégorie").fill("À garder");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText("À garder", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await page
    .getByRole("button", { name: "Ajouter une vidéo", exact: true })
    .click();
  await page.getByLabel("Lien YouTube").fill("https://youtu.be/jNQXAC9IVRw");
  await expect(page.getByLabel("Titre", { exact: false })).toHaveValue(
    "Me at the zoo",
  );
  await page.getByLabel("À garder", { exact: true }).check();
  await page
    .getByRole("dialog")
    .getByLabel("Voyage & évasion", { exact: true })
    .check();
  await page.getByLabel("Mettre à la une").check();
  await page.getByLabel("Votre petite note").fill("Un souvenir à retrouver.");
  await page.getByRole("button", { name: "Ajouter à ma collection" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".video-card")).toHaveCount(7);
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.route("https://i.ytimg.com/**", (route) => route.abort());
  await otherPage.goto("http://localhost:3100");
  await expect(
    otherPage.locator(".video-card").filter({ hasText: "Me at the zoo" }),
  ).toBeVisible();
  await other.close();
  await page.getByRole("button", { name: "Modifier Me at the zoo" }).click();
  await page.getByLabel("Titre", { exact: false }).fill("Mon premier favori");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".video-card").filter({ hasText: "Mon premier favori" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Gérer les catégories", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Supprimer À garder", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Supprimer la catégorie", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("À garder", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(
    page.locator(".video-card").filter({ hasText: "Mon premier favori" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Supprimer Mon premier favori" })
    .click();
  await page
    .getByRole("button", { name: "Retirer la vidéo", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".video-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(
    page.getByRole("link", { name: "Administration", exact: true }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page.getByLabel("Mot de passe administrateur")).toBeVisible();
  const library = await request.get("/api/library");
  expect((await library.json()).videos).toHaveLength(6);
});
test("un titre manuel permet un ajout quand oEmbed est indisponible", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Ajouter une vidéo", exact: true })
    .click();
  await page.getByLabel("Lien YouTube").fill("https://youtu.be/M7lc1UVf-VE");
  await expect(
    page.getByText("Titre indisponible : ajoutez-le ci-dessous."),
  ).toBeVisible();
  await page
    .getByLabel("Titre", { exact: false })
    .fill("Titre saisi à la main");
  await page.getByRole("button", { name: "Ajouter à ma collection" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".video-card").filter({ hasText: "Titre saisi à la main" }),
  ).toBeVisible();
});

test("le quota de connexion persiste entre les requêtes", async ({
  request,
}) => {
  for (let i = 0; i < 8; i++) {
    const response = await request.post("/api/auth/login", {
      headers: { Origin: "http://localhost:3100" },
      data: { password: "incorrect" },
    });
    expect(response.status()).toBe(401);
  }
  const blocked = await request.post("/api/auth/login", {
    headers: { Origin: "http://localhost:3100" },
    data: { password: "favorites-e2e-password" },
  });
  expect(blocked.status()).toBe(429);
  expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
});
