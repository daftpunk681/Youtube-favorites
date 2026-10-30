"use client";
import { useCallback, useState } from "react";
import { Youtube } from "lucide-react";
import { thumbnailUrl } from "@/lib/youtube";
type Props = { id: string; high?: boolean; className?: string };
export function VideoImage(props: Props) {
  // Une URL modifiée doit réinitialiser l’état de repli de la miniature.
  return <Thumbnail key={props.id} {...props} />;
}
function Thumbnail({ id, high = false, className = "" }: Props) {
  const [fallback, setFallback] = useState(false);
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => {
    if (high && !fallback) setFallback(true);
    else setFailed(true);
  }, [high, fallback]);
  const checkImage = useCallback(
    (node: HTMLImageElement | null) => {
      // Une image SSR peut échouer avant l’hydratation et son gestionnaire onError.
      if (!node?.complete) return;
      if (!node.naturalWidth) handleError();
      else if (high && !fallback && node.naturalWidth < 300) setFallback(true);
    },
    [handleError, high, fallback],
  );
  if (failed)
    return (
      <div className={`image-placeholder ${className}`}>
        <Youtube size={36} />
        <span>Miniature indisponible</span>
      </div>
    );
  // Les miniatures sont publiques ; img évite un quota d’optimisation Vercel.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={checkImage}
      src={thumbnailUrl(id, high && !fallback)}
      alt=""
      className={className}
      loading={high ? "eager" : "lazy"}
      onLoad={(e) => checkImage(e.currentTarget)}
      onError={handleError}
    />
  );
}
