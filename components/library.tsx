"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  LayoutGrid,
  Star,
  Plus,
  Search,
  ArrowUpRight,
  ArrowRight,
  Play,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  FolderOpen,
  LockKeyhole,
  Menu,
  X,
  Pencil,
  Trash2,
  LogOut,
  Check,
  LoaderCircle,
  RefreshCw,
  CircleHelp,
  Sparkles,
  Bookmark,
  ArrowLeft,
  Film,
} from "lucide-react";
import type { LibraryData, Video } from "@/lib/types";
import { watchUrl } from "@/lib/youtube";
import { filterVideos } from "@/lib/filter";
import { api } from "@/lib/client-api";
import { Player } from "./player";
import { VideoImage } from "./video-image";
import { VideoEditor } from "./video-editor";
import { CategoryManager } from "./category-manager";
import { Modal } from "./modal";
type View = "home" | "collection" | "featured";
export function Library({
  initialData,
  admin = false,
  administration = false,
}: {
  initialData: LibraryData;
  admin?: boolean;
  administration?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>(
    administration ? "collection" : "home",
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [player, setPlayer] = useState<Video | null>(null);
  const [editor, setEditor] = useState<Video | "new" | null>(null);
  const [manager, setManager] = useState(false);
  const [deleting, setDeleting] = useState<Video | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const featured = data.videos.filter((v) => v.featured);
  const hero = featured[heroIndex % Math.max(featured.length, 1)];
  const selectedCategory = data.categories.find((c) => c.id === category);
  const filtered = useMemo(
    () =>
      filterVideos(data.videos, {
        query,
        category,
        featured: view === "featured" || onlyFeatured,
        sort,
      }),
    [data.videos, query, category, view, onlyFeatured, sort],
  );
  const showHome =
    view === "home" && !query && category === "all" && !onlyFeatured;
  function navigate(next: View, cat = "all") {
    setView(next);
    setCategory(cat);
    setQuery("");
    setOnlyFeatured(false);
    setMobile(false);
  }
  async function refresh() {
    const result = await api<LibraryData>("/api/library");
    setData(result);
    if (category !== "all" && !result.categories.some((c) => c.id === category))
      setCategory("all");
  }
  async function saved() {
    await refresh();
    setToast("Votre collection a été mise à jour.");
  }
  async function toggleFeatured(video: Video) {
    setBusy(video.id);
    setError("");
    try {
      await api(`/api/videos/${video.id}`, "PATCH", {
        url: watchUrl(video.youtubeId),
        title: video.title,
        author: video.author,
        notes: video.notes,
        categories: video.categories,
        featured: !video.featured,
      });
      await refresh();
      setToast(
        video.featured ? "Vidéo retirée de la une." : "Vidéo ajoutée à la une.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Modification impossible.");
    } finally {
      setBusy(null);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy("delete");
    setError("");
    try {
      await api(`/api/videos/${deleting.id}`, "DELETE");
      await refresh();
      setDeleting(null);
      setToast("La vidéo a été retirée de votre collection.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  }
  async function logout() {
    setBusy("logout");
    try {
      await api("/api/auth/logout", "POST");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Déconnexion impossible.");
    } finally {
      setBusy(null);
    }
  }
  const addButton = admin ? (
    <button
      className="btn btn-primary add-video"
      onClick={() => setEditor("new")}
    >
      <Plus size={18} />
      <span>Ajouter une vidéo</span>
    </button>
  ) : (
    <Link href="/admin" className="btn btn-primary add-video">
      <Plus size={18} />
      <span>Ajouter une vidéo</span>
    </Link>
  );
  const title =
    selectedCategory?.name ??
    (view === "featured"
      ? "Vos incontournables."
      : view === "collection"
        ? "Toutes vos découvertes."
        : "Les bonnes vidéos, au bon endroit.");
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobile(false)}
          aria-label="Fermer le menu"
        />
      )}
      <aside className={clsx("sidebar", mobile && "sidebar-open")}>
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Play size={20} fill="currentColor" />
          </span>
          <span>
            YouTube
            <span className="brand-sub">
              Favorites<span className="brand-period">.</span>
            </span>
          </span>
        </Link>
        <button
          className="icon-btn mobile-close"
          aria-label="Fermer le menu"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <p className="sidebar-label">VOTRE ESPACE</p>
        <nav className="main-nav" aria-label="Navigation principale">
          <button
            className={clsx("nav-item", view === "home" && "active")}
            onClick={() => navigate("home")}
          >
            <Home size={19} />
            <span>Accueil</span>
          </button>
          <button
            className={clsx(
              "nav-item",
              view === "collection" && category === "all" && "active",
            )}
            onClick={() => navigate("collection")}
          >
            <LayoutGrid size={19} />
            <span>Ma collection</span>
            <span className="nav-count">{data.videos.length}</span>
          </button>
          <button
            className={clsx("nav-item", view === "featured" && "active")}
            onClick={() => navigate("featured")}
          >
            <Star size={19} />
            <span>À la une</span>
            <span className="nav-count">{featured.length}</span>
          </button>
        </nav>
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <p className="sidebar-label">MES CATÉGORIES</p>
            {admin && (
              <button
                className="icon-btn"
                onClick={() => setManager(true)}
                aria-label="Gérer les catégories"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <nav className="category-nav" aria-label="Catégories">
            {data.categories.map((c) => (
              <button
                key={c.id}
                className={clsx(
                  "nav-item category-nav-item",
                  category === c.id && "active",
                )}
                onClick={() => navigate("collection", c.id)}
              >
                <span className={`dot dot-${c.color}`} />
                <span>{c.name}</span>
                <span className="category-count">
                  {
                    data.videos.filter((v) => v.categories.includes(c.id))
                      .length
                  }
                </span>
              </button>
            ))}
          </nav>
          {admin && (
            <button
              className="manage-categories"
              onClick={() => setManager(true)}
            >
              <FolderOpen size={15} />
              Gérer les catégories
            </button>
          )}
          {!data.categories.length && (
            <p className="sidebar-empty">Vos idées, bientôt bien rangées.</p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">
              <Bookmark size={18} />
            </span>
            <p>
              Moins de liens perdus.
              <br />
              <strong>Plus de belles découvertes.</strong>
            </p>
            <span className="note-decoration">✳</span>
          </div>
          {admin ? (
            <button
              className="nav-item admin-nav"
              onClick={logout}
              disabled={busy === "logout"}
            >
              <LogOut size={17} />
              <span>Se déconnecter</span>
              <span className="admin-dot" />
            </button>
          ) : (
            <Link className="nav-item admin-nav" href="/admin">
              <LockKeyhole size={17} />
              <span>Administration</span>
              <ArrowUpRight size={15} />
            </Link>
          )}
          <p className="sidebar-copyright">UN PETIT COIN D’INTERNET, À VOUS.</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="icon-btn menu-toggle"
              onClick={() => setMobile(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={mobile}
            >
              <Menu size={22} />
            </button>
            <span className="location-home">
              <Home size={15} />
            </span>
            <ChevronRight size={13} />
            <span>
              {administration
                ? "Administration"
                : view === "home"
                  ? "Votre espace"
                  : view === "featured"
                    ? "À la une"
                    : "Ma collection"}
            </span>
          </div>
          <div className="topbar-actions">
            {data.demo ? (
              <span className="demo-pill">
                <span />
                Collection démo
              </span>
            ) : admin ? (
              <span className="admin-pill">
                <span />
                Mode administration
              </span>
            ) : (
              <span className="public-label">Collection personnelle</span>
            )}
            <span className="topbar-divider" />
            <Link
              href="/admin"
              className="avatar"
              aria-label="Ouvrir l’administration"
            >
              {admin ? (
                <LockKeyhole size={17} />
              ) : (
                <span>
                  Y<span className="avatar-small">f</span>
                </span>
              )}
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-line" />
                {administration
                  ? "FAITES GRANDIR VOTRE COLLECTION"
                  : "GARDEZ CE QUI VOUS INSPIRE"}
              </div>
              <h1>{title}</h1>
              <p>
                {selectedCategory
                  ? "Un thème, mille façons de se laisser inspirer."
                  : view === "featured"
                    ? "Le meilleur de votre collection, à portée de clic."
                    : view === "collection"
                      ? "Vos vidéos préférées. Classées, retrouvées, appréciées."
                      : "Un espace pour retrouver les vidéos qui méritent d’être gardées."}
              </p>
            </div>
            {addButton}
          </div>
          {data.demo && (
            <div className="demo-banner">
              <CircleHelp size={15} />
              <p>
                Un aperçu pour vous inspirer.{" "}
                <Link href="/admin">Configurez votre espace</Link> pour
                enregistrer vos propres vidéos.
              </p>
              <span>DÉMONSTRATION</span>
            </div>
          )}
          {data.unavailable && (
            <div className="service-error" role="alert">
              <CircleHelp size={22} />
              <div>
                <strong>
                  Votre collection est momentanément indisponible.
                </strong>
                <p>
                  Vérifiez la connexion à la base et la migration, puis
                  réessayez.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  refresh().catch(() =>
                    setError(
                      "La base est toujours indisponible. Réessayez plus tard.",
                    ),
                  )
                }
              >
                <RefreshCw size={16} />
                Réessayer
              </button>
            </div>
          )}
          {showHome && hero && (
            <section className="featured-layout" aria-label="Vidéos à la une">
              <div className="hero-card">
                <VideoImage
                  key={hero.youtubeId}
                  id={hero.youtubeId}
                  high
                  className="hero-image"
                />
                <div className="hero-shade" />
                <div className="hero-top">
                  <span className="hero-badge">
                    <Star size={12} fill="currentColor" />À LA UNE
                  </span>
                  <span className="hero-curated">
                    <span />
                    SÉLECTION PERSONNELLE
                  </span>
                </div>
                <div className="hero-content">
                  <p className="hero-category">
                    {data.categories.find((c) => hero.categories.includes(c.id))
                      ?.name ?? "Une vidéo à découvrir"}
                    <span> / </span>
                    {hero.author || "YouTube"}
                  </p>
                  <h2>{hero.title}</h2>
                  {hero.notes && (
                    <p className="hero-description">{hero.notes}</p>
                  )}
                  <button
                    className="btn hero-play"
                    onClick={() => setPlayer(hero)}
                  >
                    <Play size={16} fill="currentColor" />
                    Regarder la vidéo
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                {featured.length > 1 && (
                  <div className="hero-pagination">
                    <span>
                      {String((heroIndex % featured.length) + 1).padStart(
                        2,
                        "0",
                      )}
                      <small>
                        {" "}
                        / {String(featured.length).padStart(2, "0")}
                      </small>
                    </span>
                    <button
                      className="icon-btn"
                      onClick={() => setHeroIndex((i) => i + 1)}
                      aria-label="Vidéo à la une suivante"
                    >
                      <ArrowRight size={19} />
                    </button>
                  </div>
                )}
              </div>
              <div className="spotlight-panel">
                <div className="spotlight-heading">
                  <span className="mini-icon">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <span className="eyebrow">LE PLAISIR DE REDÉCOUVRIR</span>
                    <h2>À voir & à revoir</h2>
                  </div>
                </div>
                {featured
                  .filter((v) => v.id !== hero.id)
                  .slice(0, 2)
                  .map((v, i) => (
                    <button
                      className="spotlight-video"
                      key={v.id}
                      onClick={() => setPlayer(v)}
                    >
                      <div className="spotlight-image">
                        <VideoImage id={v.youtubeId} />
                        <span className="mini-play">
                          <Play size={12} fill="currentColor" />
                        </span>
                        <span className="spotlight-index">0{i + 1}</span>
                      </div>
                      <h3>{v.title}</h3>
                      <p>
                        {v.author || "YouTube"}
                        <ArrowUpRight size={14} />
                      </p>
                    </button>
                  ))}
                {featured.length < 2 && (
                  <div className="spotlight-empty">
                    <Star size={28} />
                    <p>Une place pour vos coups de cœur.</p>
                    <span>Les vidéos mises à la une apparaîtront ici.</span>
                  </div>
                )}
                <button
                  className="spotlight-link"
                  onClick={() => navigate("featured")}
                >
                  Toute la sélection <ArrowRight size={15} />
                </button>
              </div>
            </section>
          )}
          {showHome && (
            <div className="collection-stats">
              <span>
                <span className="stat-icon">
                  <Film size={16} />
                </span>
                <strong>{data.videos.length}</strong> vidéos à retrouver
              </span>
              <span>
                <span className="stat-icon">
                  <FolderOpen size={16} />
                </span>
                <strong>{data.categories.length}</strong> univers à explorer
              </span>
              <span>
                <span className="stat-icon">
                  <Star size={16} />
                </span>
                <strong>{featured.length}</strong> coups de cœur
              </span>
              <p>
                Votre curiosité a trouvé sa place.<span>✳</span>
              </p>
            </div>
          )}
          <section
            className="collection-section"
            aria-labelledby="collection-title"
          >
            <div className="section-heading">
              <div className="section-title">
                <span className="section-title-icon">
                  {view === "featured" ? (
                    <Star size={19} />
                  ) : (
                    <LayoutGrid size={19} />
                  )}
                </span>
                <h2 id="collection-title">
                  {selectedCategory?.name ??
                    (view === "featured" ? "La sélection" : "Votre collection")}
                  <span className="count-badge">{filtered.length}</span>
                </h2>
              </div>
              {showHome && (
                <button
                  className="text-link see-all"
                  onClick={() => navigate("collection")}
                >
                  Tout explorer <ArrowUpRight size={15} />
                </button>
              )}
            </div>
            <div className="collection-toolbar">
              <div className="search-field">
                <Search size={18} />
                <input
                  ref={searchRef}
                  aria-label="Rechercher une vidéo"
                  placeholder="Un titre, une chaîne, une idée…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Effacer la recherche"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="toolbar-controls">
                <button
                  className={clsx(
                    "filter-button",
                    showFilters && "active",
                    (category !== "all" || onlyFeatured) && "has-filter",
                  )}
                  onClick={() => setShowFilters(!showFilters)}
                  aria-expanded={showFilters}
                  aria-controls="filter-panel"
                >
                  <SlidersHorizontal size={16} />
                  <span>Filtrer</span>
                  {(category !== "all" || onlyFeatured) && (
                    <span className="filter-indicator" />
                  )}
                </button>
                <div className="sort-control">
                  <label htmlFor="sort-videos" className="sr-only">
                    Trier les vidéos
                  </label>
                  <select
                    id="sort-videos"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Ajouts récents</option>
                    <option value="oldest">Les plus anciennes</option>
                    <option value="title">Titre : A → Z</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
            {showFilters && (
              <div className="filter-panel" id="filter-panel">
                <div className="filter-category">
                  <label htmlFor="filter-category">Catégorie</label>
                  <select
                    id="filter-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="all">Toutes les catégories</option>
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {view !== "featured" && (
                  <label className="filter-featured">
                    <input
                      type="checkbox"
                      checked={onlyFeatured}
                      onChange={(e) => setOnlyFeatured(e.target.checked)}
                    />
                    <Star size={15} /> À la une uniquement
                  </label>
                )}
                <button
                  className="text-link"
                  onClick={() => {
                    setCategory("all");
                    setOnlyFeatured(false);
                    setQuery("");
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            )}
            <div className="category-tabs" aria-label="Filtrer par catégorie">
              <button
                className={clsx(
                  "category-tab",
                  category === "all" && "selected",
                )}
                aria-pressed={category === "all"}
                onClick={() => setCategory("all")}
              >
                Tout voir <span>{data.videos.length}</span>
              </button>
              {data.categories.map((c) => (
                <button
                  key={c.id}
                  className={clsx(
                    "category-tab",
                    category === c.id && "selected",
                  )}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  <span className={`dot dot-${c.color}`} />
                  {c.name}
                </button>
              ))}
            </div>
            {error && !deleting && (
              <div className="inline-error" role="alert">
                {error}
                <button
                  className="icon-btn"
                  aria-label="Fermer le message"
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {filtered.length ? (
              <div className="video-grid">
                {filtered.map((video) => (
                  <article className="video-card" key={video.id}>
                    <div className="card-image-wrap">
                      <button
                        className="card-watch"
                        onClick={() => setPlayer(video)}
                        aria-label={`Regarder ${video.title}`}
                      >
                        <VideoImage id={video.youtubeId} />
                        <span className="card-image-shade" />
                        <span className="card-play">
                          <Play size={22} fill="currentColor" />
                        </span>
                        <span className="youtube-badge">
                          <Play size={9} fill="currentColor" />
                          YOUTUBE
                        </span>
                      </button>
                      {admin ? (
                        <button
                          className={clsx(
                            "card-star",
                            video.featured && "is-featured",
                          )}
                          onClick={() => toggleFeatured(video)}
                          disabled={busy === video.id}
                          aria-label={
                            video.featured
                              ? `Retirer ${video.title} de la une`
                              : `Mettre ${video.title} à la une`
                          }
                          aria-pressed={video.featured}
                        >
                          {busy === video.id ? (
                            <LoaderCircle size={15} className="spin" />
                          ) : (
                            <Star
                              size={15}
                              fill={video.featured ? "currentColor" : "none"}
                            />
                          )}
                        </button>
                      ) : (
                        video.featured && (
                          <span
                            className="card-star is-featured"
                            title="À la une"
                          >
                            <Star size={14} fill="currentColor" />
                          </span>
                        )
                      )}
                    </div>
                    <div className="card-body">
                      <div className="tag-row">
                        {data.categories
                          .filter((c) => video.categories.includes(c.id))
                          .slice(0, 2)
                          .map((c) => (
                            <button
                              key={c.id}
                              className={`tag tag-${c.color}`}
                              onClick={() => setCategory(c.id)}
                            >
                              {c.name}
                            </button>
                          ))}
                        {!video.categories.length && (
                          <span className="tag tag-neutral">À découvrir</span>
                        )}
                        {video.categories.length > 2 && (
                          <span className="tag tag-neutral">
                            +{video.categories.length - 2}
                          </span>
                        )}
                      </div>
                      <button
                        className="card-title"
                        onClick={() => setPlayer(video)}
                      >
                        <h3>{video.title}</h3>
                      </button>
                      <div className="card-bottom">
                        <p className="card-author">
                          <span className="author-dot" />
                          {video.author || "Vidéo YouTube"}
                        </p>
                        {admin ? (
                          <div className="card-admin">
                            <button
                              className="icon-btn"
                              onClick={() => setEditor(video)}
                              aria-label={`Modifier ${video.title}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="icon-btn danger-hover"
                              onClick={() => {
                                setDeleting(video);
                                setError("");
                              }}
                              aria-label={`Supprimer ${video.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <ArrowUpRight size={16} className="card-arrow" />
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              !data.unavailable && (
                <div className="empty-state">
                  <span>
                    <Search size={30} />
                  </span>
                  <h3>
                    {query || category !== "all" || onlyFeatured
                      ? "Aucune vidéo par ici."
                      : view === "featured"
                        ? "Vos coups de cœur vous attendent."
                        : "La première découverte vous attend."}
                  </h3>
                  <p>
                    {query || category !== "all" || onlyFeatured
                      ? "Essayez un autre mot-clé ou élargissez vos filtres."
                      : view === "featured"
                        ? "Mettez une vidéo à la une pour la retrouver ici."
                        : "Ajoutez un lien YouTube et donnez vie à votre collection."}
                  </p>
                  {query || category !== "all" || onlyFeatured ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setQuery("");
                        setCategory("all");
                        setOnlyFeatured(false);
                      }}
                    >
                      Effacer les filtres
                    </button>
                  ) : view === "featured" ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate("collection")}
                    >
                      <ArrowLeft size={16} />
                      Voir ma collection
                    </button>
                  ) : (
                    addButton
                  )}
                </div>
              )
            )}
            <div className="collection-bottom">
              <span>
                {filtered.length} vidéo{filtered.length > 1 ? "s" : ""} ·{" "}
                {query
                  ? "Résultats de recherche"
                  : selectedCategory
                    ? selectedCategory.name
                    : "Des découvertes à votre rythme"}
              </span>
              <span className="collection-bottom-note">
                Collectionnez l’inspiration.
                <Bookmark size={13} />
              </span>
            </div>
          </section>
          <footer className="page-footer">
            <span>
              YouTube Favorites<span className="brand-period">.</span>
            </span>
            <p>Un peu moins de bruit. Un peu plus de sens.</p>
            <span>
              Fait pour les curieux <span className="footer-asterisk">✳</span>
            </span>
          </footer>
        </main>
      </div>
      {player && (
        <Player
          video={player}
          categories={data.categories}
          onClose={() => setPlayer(null)}
        />
      )}{" "}
      {editor && admin && (
        <VideoEditor
          video={editor === "new" ? undefined : editor}
          categories={data.categories}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}{" "}
      {manager && admin && (
        <CategoryManager
          categories={data.categories}
          onClose={() => setManager(false)}
          onSaved={saved}
        />
      )}{" "}
      {deleting && admin && (
        <Modal
          title="Retirer cette vidéo ?"
          onClose={() => {
            setDeleting(null);
            setError("");
          }}
        >
          <div className="delete-dialog">
            <div className="delete-video-preview">
              <VideoImage id={deleting.youtubeId} />
              <strong>{deleting.title}</strong>
            </div>
            <p>
              Cette vidéo sera retirée de votre collection et de ses catégories.
              Vous pourrez toujours l’ajouter à nouveau avec son lien YouTube.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleting(null)}
              >
                Conserver
              </button>
              <button
                className="btn btn-danger"
                disabled={busy === "delete"}
                onClick={remove}
              >
                {busy === "delete" ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                Retirer la vidéo
              </button>
            </div>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button
            className="icon-btn"
            onClick={() => setToast("")}
            aria-label="Fermer la notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
