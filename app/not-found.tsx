import Link from "next/link";
export default function NotFound() {
  return (
    <main className="loading-screen">
      <p className="eyebrow">404 · HORS COLLECTION</p>
      <h1>Cette page reste à découvrir.</h1>
      <Link className="btn btn-primary" href="/">
        Revenir à l’accueil
      </Link>
    </main>
  );
}
