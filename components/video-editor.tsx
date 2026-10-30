"use client";
import { useEffect, useRef, useState } from "react";
import { Link2, LoaderCircle, Check, Star, AlertCircle } from "lucide-react";
import type { Category, Video, VideoInput } from "@/lib/types";
import { parseYouTubeUrl, watchUrl, videoInputSchema } from "@/lib/youtube";
import { api } from "@/lib/client-api";
import { Modal } from "./modal";
import { VideoImage } from "./video-image";
export function VideoEditor({
  video,
  categories,
  onClose,
  onSaved,
}: {
  video?: Video;
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<VideoInput>({
    url: video ? watchUrl(video.youtubeId) : "",
    title: video?.title ?? "",
    author: video?.author ?? "",
    notes: video?.notes ?? "",
    featured: video?.featured ?? false,
    categories: video?.categories ?? [],
  });
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [metaState, setMetaState] = useState<"idle" | "found" | "missing">(
    "idle",
  );
  const [error, setError] = useState("");
  const touched = useRef({ title: false, author: false });
  const youtubeId = parseYouTubeUrl(form.url);
  useEffect(() => {
    if (!youtubeId || youtubeId === video?.youtubeId) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFetching(true);
      setMetaState("idle");
      try {
        const data = await api<{
          title: string;
          author: string;
          available: boolean;
        }>(
          "/api/videos/metadata",
          "POST",
          { url: watchUrl(youtubeId) },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setForm((f) => ({
          ...f,
          title: touched.current.title ? f.title : data.title,
          author: touched.current.author ? f.author : data.author,
        }));
        setMetaState(data.available ? "found" : "missing");
      } catch (err) {
        if (!controller.signal.aborted) {
          setMetaState("missing");
          if (err instanceof Error && err.message.includes("Connectez"))
            setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
      setFetching(false);
    };
  }, [youtubeId, video?.youtubeId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = videoInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      await api(
        video ? `/api/videos/${video.id}` : "/api/videos",
        video ? "PATCH" : "POST",
        parsed.data,
      );
      await onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={video ? "Modifier la vidéo" : "Une nouvelle trouvaille ?"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="editor-form">
        <p className="muted form-intro">
          Un lien suffit pour commencer votre collection.
        </p>
        <label htmlFor="video-url">
          Lien YouTube <span className="required">*</span>
        </label>
        <div className="input-icon">
          <Link2 size={18} />
          <input
            data-initial-focus
            id="video-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={form.url}
            maxLength={2048}
            required
            onChange={(e) => {
              setForm({ ...form, url: e.target.value });
              setMetaState("idle");
            }}
          />
        </div>
        {form.url && !youtubeId && (
          <p className="field-hint error-text">
            Utilisez un lien youtube.com, youtu.be ou Shorts.
          </p>
        )}
        {youtubeId && (
          <div className="metadata-preview">
            <VideoImage key={youtubeId} id={youtubeId} />
            <div>
              {fetching ? (
                <p>
                  <LoaderCircle size={14} className="spin" /> Récupération des
                  informations…
                </p>
              ) : metaState === "found" ? (
                <p className="success-text">
                  <Check size={14} /> Informations récupérées
                </p>
              ) : (
                <p>
                  {metaState === "missing"
                    ? "Titre indisponible : ajoutez-le ci-dessous."
                    : "Votre vidéo est prête à être ajoutée."}
                </p>
              )}
              <span className="fineprint">
                Vous pouvez personnaliser le titre et la chaîne.
              </span>
            </div>
          </div>
        )}
        <label htmlFor="video-title">
          Titre <span className="required">*</span>
        </label>
        <input
          id="video-title"
          value={form.title}
          maxLength={200}
          placeholder="Le titre de votre vidéo"
          required
          onChange={(e) => {
            touched.current.title = true;
            setForm({ ...form, title: e.target.value });
          }}
        />
        <label htmlFor="video-author">Chaîne</label>
        <input
          id="video-author"
          value={form.author}
          maxLength={200}
          placeholder="Nom de la chaîne (facultatif)"
          onChange={(e) => {
            touched.current.author = true;
            setForm({ ...form, author: e.target.value });
          }}
        />
        <fieldset>
          <legend>
            Catégories{" "}
            <span className="muted">· plusieurs choix possibles</span>
          </legend>
          <div className="category-choices">
            {categories.length ? (
              categories.map((c) => (
                <label
                  key={c.id}
                  className={`category-choice ${form.categories.includes(c.id) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.categories.includes(c.id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        categories: e.target.checked
                          ? [...form.categories, c.id]
                          : form.categories.filter((id) => id !== c.id),
                      })
                    }
                  />
                  <span className={`dot dot-${c.color}`} />
                  {c.name}
                  {form.categories.includes(c.id) && <Check size={13} />}
                </label>
              ))
            ) : (
              <p className="field-hint">
                Créez vos premières catégories depuis « Gérer les catégories ».
              </p>
            )}
          </div>
        </fieldset>
        <label htmlFor="video-notes">Votre petite note</label>
        <textarea
          id="video-notes"
          rows={3}
          value={form.notes}
          maxLength={2000}
          placeholder="Pourquoi garder cette vidéo ? (facultatif)"
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <label className="featured-choice">
          <span className="featured-choice-icon">
            <Star size={20} />
          </span>
          <span>
            <strong>Mettre à la une</strong>
            <small>Faire apparaître cette vidéo sur l’accueil</small>
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            <AlertCircle size={17} />
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || fetching}
          >
            {busy ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}{" "}
            {busy
              ? "Enregistrement…"
              : video
                ? "Enregistrer"
                : "Ajouter à ma collection"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
