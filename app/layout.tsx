import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "YouTube Favorites — Vos vidéos, bien gardées.",
  description:
    "Un espace personnel pour retrouver, organiser et savourer les vidéos qui comptent.",
};
export const viewport: Viewport = { themeColor: "#101114" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
