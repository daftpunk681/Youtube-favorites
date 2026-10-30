"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Play,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { api } from "@/lib/client-api";
export function Login({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", "POST", { password });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <Link href="/" className="login-back text-link">
        <ArrowLeft size={17} /> Retour à la collection
      </Link>
      <div className="login-wrap">
        <Link className="brand login-brand" href="/">
          <span className="brand-icon">
            <Play size={21} fill="currentColor" />
          </span>
          <span>
            YouTube
            <span className="brand-sub">
              Favorites<span className="brand-period">.</span>
            </span>
          </span>
        </Link>
        <div className="login-card">
          <span className="login-lock">
            <LockKeyhole size={25} />
          </span>
          <p className="eyebrow">VOTRE ESPACE PERSONNEL</p>
          <h1>Bienvenue chez vous.</h1>
          <p className="muted">Retrouvez les commandes de votre collection.</p>
          {configured ? (
            <form onSubmit={submit}>
              <label htmlFor="password">Mot de passe administrateur</label>
              <div className="password-input">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  maxLength={1024}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={
                    show
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? <LoaderCircle size={18} className="spin" /> : null}
                {busy ? "Connexion…" : "Entrer dans mon espace"}
                <ArrowRight size={17} />
              </button>
            </form>
          ) : (
            <div className="setup-message" role="status">
              <h2>Votre espace est presque prêt.</h2>
              <p>
                La collection de démonstration est accessible. Pour gérer vos
                propres vidéos, terminez la configuration du serveur en suivant
                le README du projet.
              </p>
              <ol>
                <li>Connecter la base gratuite Neon.</li>
                <li>Définir le mot de passe d’administration.</li>
                <li>Ajouter le secret de session.</li>
              </ol>
              <a
                className="btn btn-primary"
                href="https://github.com/daftpunk681/Youtube-favorites#readme"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir le guide <ArrowRight size={16} />
              </a>
            </div>
          )}
          <div className="login-secure">
            <LockKeyhole size={13} /> Connexion sécurisée · Session de 8 heures
          </div>
        </div>
        <p className="login-footer">
          Vos découvertes méritent un endroit à elles.
        </p>
      </div>
    </main>
  );
}
