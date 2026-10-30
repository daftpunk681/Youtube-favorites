import "server-only";
import { watchUrl, thumbnailUrl } from "./youtube";
export async function fetchVideoMetadata(id: string) {
  const fallback = {
    youtubeId: id,
    title: "",
    author: "",
    thumbnail: thumbnailUrl(id),
    available: false,
  };
  try {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("url", watchUrl(id));
    endpoint.searchParams.set("format", "json");
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
      redirect: "error",
    });
    if (!response.ok) return fallback;
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("title" in data) ||
      typeof data.title !== "string"
    )
      return fallback;
    return {
      ...fallback,
      title: data.title.slice(0, 200),
      author:
        "author_name" in data && typeof data.author_name === "string"
          ? data.author_name.slice(0, 200)
          : "",
      available: true,
    };
  } catch {
    return fallback;
  }
}
