// Adaptateur de transport utilisé uniquement par le serveur Playwright.
// Aucun embranchement de test n’est ajouté au code de l’application.
if (process.env.YTF_E2E_BRIDGE !== "1")
  throw new Error("Ce transport est réservé aux tests E2E.");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (url.hostname.endsWith(".invalid") && url.pathname === "/sql")
    return originalFetch("http://127.0.0.1:3101/sql", options);
  if (url.hostname === "www.youtube.com" && url.pathname === "/oembed") {
    const video = new URL(url.searchParams.get("url")).searchParams.get("v");
    return video === "jNQXAC9IVRw"
      ? new Response(
          JSON.stringify({ title: "Me at the zoo", author_name: "jawed" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      : new Response("", { status: 404 });
  }
  return originalFetch(input, options);
};
