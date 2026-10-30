"use client";
import { useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
import type { Category, CategoryColor } from "@/lib/types";
import { api } from "@/lib/client-api";
import { Modal } from "./modal";
const colors: CategoryColor[] = ["teal", "orange", "purple", "blue", "rose"];
const colorNames = {
  teal: "Vert",
  orange: "Orange",
  purple: "Violet",
  blue: "Bleu",
  rose: "Rose",
};
export function CategoryManager({
  categories,
  onClose,
  onSaved,
}: {
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<CategoryColor>("teal");
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function reset() {
    setEditing(null);
    setName("");
    setColor("teal");
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        editing ? `/api/categories/${editing.id}` : "/api/categories",
        editing ? "PATCH" : "POST",
        { name, color },
      );
      await onSaved();
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/categories/${deleting.id}`, "DELETE");
      await onSaved();
      if (editing?.id === deleting.id) reset();
      setDeleting(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Vos catégories" onClose={onClose}>
      <div className="category-manager">
        <p className="muted">Un peu d’ordre pour retrouver vos inspirations.</p>
        {deleting ? (
          <div className="delete-category">
            <button className="text-link" onClick={() => setDeleting(null)}>
              <ArrowLeft size={15} /> Revenir aux catégories
            </button>
            <h3>Supprimer « {deleting.name} » ?</h3>
            <p>
              Les vidéos seront conservées. Seule cette catégorie sera retirée.
            </p>
            <button className="btn btn-danger" disabled={busy} onClick={remove}>
              {busy ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Supprimer la catégorie
            </button>
          </div>
        ) : (
          <>
            <div className="category-list">
              {categories.length ? (
                categories.map((c) => (
                  <div key={c.id} className="category-row">
                    <span className={`dot dot-${c.color}`} />
                    <span>{c.name}</span>
                    <button
                      className="icon-btn"
                      aria-label={`Renommer ${c.name}`}
                      onClick={() => {
                        setEditing(c);
                        setName(c.name);
                        setColor(c.color);
                        setError("");
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn danger-hover"
                      aria-label={`Supprimer ${c.name}`}
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-inline">
                  Votre collection attend sa première catégorie.
                </p>
              )}
            </div>
            <form onSubmit={save} className="category-create">
              <h3>
                {editing ? "Modifier la catégorie" : "Créer une catégorie"}
              </h3>
              <label htmlFor="category-name">Nom de la catégorie</label>
              <input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Documentaires, musique, idées…"
                required
                maxLength={40}
              />
              <fieldset>
                <legend>Couleur</legend>
                <div className="color-options">
                  {colors.map((c) => (
                    <label
                      key={c}
                      className={`color-option dot-${c} ${color === c ? "active" : ""}`}
                      title={colorNames[c]}
                    >
                      <input
                        type="radio"
                        name="color"
                        value={c}
                        checked={color === c}
                        onChange={() => setColor(c)}
                        aria-label={colorNames[c]}
                      />
                      {color === c && <Check size={16} />}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="modal-actions">
                {editing && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={reset}
                  >
                    Annuler
                  </button>
                )}
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : editing ? (
                    <Check size={16} />
                  ) : (
                    <Plus size={16} />
                  )}{" "}
                  {editing ? "Enregistrer" : "Créer la catégorie"}
                </button>
              </div>
            </form>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
