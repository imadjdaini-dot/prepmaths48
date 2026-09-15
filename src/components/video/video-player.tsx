"use client";

import { useEffect, useRef, useState } from "react";

type Source = { type: "iframe" | "file"; src: string };

/**
 * Lecteur vidéo sécurisé :
 * - source `file` passe par le proxy signé (jamais l'URL réelle) ;
 * - filigrane dynamique avec l'email de l'élève (anti-rediffusion) ;
 * - téléchargement natif désactivé (controlsList, menu contextuel) ;
 * - remontée périodique de la progression + complétion à la fin.
 */
export function VideoPlayer({
  source,
  lessonId,
  watermark,
  onCompleted,
}: {
  source: Source | null;
  lessonId: string;
  watermark: string;
  onCompleted?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const lastSent = useRef(0);
  const [completedSent, setCompletedSent] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const onTime = () => {
      const now = Math.floor(v.currentTime);
      // Envoie la progression toutes les ~15s.
      if (now - lastSent.current >= 15) {
        lastSent.current = now;
        void fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, watchedSeconds: now }),
        });
      }
    };
    const onEnded = () => {
      if (completedSent) return;
      setCompletedSent(true);
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, isCompleted: true }),
      }).then(() => onCompleted?.());
    };

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [lessonId, completedSent, onCompleted]);

  if (!source) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-md bg-navy text-sm text-[#9fb0c9]">
        Vidéo bientôt disponible.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md bg-black">
      {source.type === "iframe" ? (
        <iframe
          src={source.src}
          className="aspect-video w-full"
          allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Lecteur vidéo"
        />
      ) : (
        <video
          ref={ref}
          src={source.src}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="aspect-video w-full"
          playsInline
        />
      )}

      {/* Filigrane dynamique */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <span className="absolute right-3 top-3 rounded bg-black/30 px-2 py-1 font-mono text-[10px] text-white/70">
          {watermark}
        </span>
        <span className="absolute bottom-12 left-4 font-mono text-[11px] text-white/15">
          {watermark} · Prép-Maths48
        </span>
      </div>
    </div>
  );
}
