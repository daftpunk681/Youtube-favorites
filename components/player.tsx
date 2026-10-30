"use client";
import { useState } from "react";
import { ExternalLink, Play, ShieldCheck } from "lucide-react";
import type { Video, Category } from "@/lib/types";
import { watchUrl } from "@/lib/youtube";
import { Modal } from "./modal";
import { VideoImage } from "./video-image";
export function Player({
  video,
  categories,
  onClose,
}: {
  video: Video;
  categories: Category[];
  onClose: () => void;
}) {
  const [consent, setConsent] = useState(false);
  return (
    <Modal title="Installez-vous, et profitez." onClose={onClose} wide>
      <div className="player-screen">
        {consent ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <>
            <VideoImage id={video.youtubeId} high />
            <div className="player-consent">
              <button
                className="btn btn-primary"
                onClick={() => setConsent(true)}
              >
                <Play size={18} fill="currentColor" />
                Lancer la vidéo
              </button>
              <p>
                <ShieldCheck size={14} /> Le lecteur YouTube se charge à votre
                demande.
              </p>
            </div>
          </>
        )}
      </div>
      <div className="player-details">
        <div className="tag-row">
          {categories
            .filter((c) => video.categories.includes(c.id))
            .map((c) => (
              <span key={c.id} className={`tag tag-${c.color}`}>
                {c.name}
              </span>
            ))}
        </div>
        <h3>{video.title}</h3>
        <p className="muted">{video.author || "Vidéo YouTube"}</p>
        {video.notes && <p className="player-notes">{video.notes}</p>}
        <a
          className="text-link"
          href={watchUrl(video.youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ouvrir sur YouTube <ExternalLink size={14} />
        </a>
        <p className="fineprint">
          Si la vidéo est privée, supprimée ou si son auteur bloque
          l’intégration, ouvrez-la sur YouTube.
        </p>
      </div>
    </Modal>
  );
}
