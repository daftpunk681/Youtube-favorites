"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="loading-screen">
      <h1>Une pause imprévue.</h1>
      <p>La page n’a pas pu se charger.</p>
      <button className="btn btn-primary" onClick={reset}>
        Réessayer
      </button>
      <Link href="/">Revenir à l’accueil</Link>
    </main>
  );
}
