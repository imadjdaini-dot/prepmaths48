"use client";

import { useEffect, useState } from "react";
import { Radio, Clock, ExternalLink } from "lucide-react";
import type { Level, Track } from "@prisma/client";
import { formatLevelTrack } from "@/types";

const JOIN_OPENS_BEFORE_MS = 10 * 60_000;
const JOIN_CLOSES_AFTER_MS = 15 * 60_000;
const REFRESH_MS = 30_000;

function formatDateTime(d: Date): string {
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Carte élève pour une session live. Le bouton « Rejoindre » ne devient un
 * vrai lien vers meetUrl que dans la fenêtre [startAt-10min, fin+15min] ;
 * la pastille « EN DIRECT » s'affiche pendant la même fenêtre.
 */
export function LiveSessionCard({
  title,
  description,
  meetUrl,
  startAt,
  durationMinutes,
  level,
  track,
}: {
  title: string;
  description: string | null;
  meetUrl: string;
  startAt: string;
  durationMinutes: number;
  level: Level | null;
  track: Track | null;
}) {
  // Force un nouveau rendu périodique pour réévaluer la fenêtre de temps.
  const [, refresh] = useState(0);
  useEffect(() => {
    const id = setInterval(() => refresh((n) => n + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const start = new Date(startAt);
  const startMs = start.getTime();
  const endMs = startMs + durationMinutes * 60_000;
  const joinOpensMs = startMs - JOIN_OPENS_BEFORE_MS;
  const joinClosesMs = endMs + JOIN_CLOSES_AFTER_MS;
  const now = Date.now();

  const status: "upcoming" | "live" | "ended" =
    now < joinOpensMs ? "upcoming" : now <= joinClosesMs ? "live" : "ended";

  return (
    <div className="card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[17px] font-semibold">{title}</h3>
            {status === "live" && (
              <span className="mono inline-flex items-center gap-1.5 rounded-md bg-[color:var(--red)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                En direct
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          <p className="mono mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
            <Clock className="h-3.5 w-3.5" />
            {formatDateTime(start)} · {durationMinutes} min
            {(level || track) && ` · ${formatLevelTrack(level, track)}`}
          </p>
        </div>

        {status === "live" ? (
          <a
            href={meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm shrink-0"
          >
            <Radio className="h-4 w-4" /> Rejoindre <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <button type="button" disabled className="btn btn-ghost btn-sm shrink-0">
            <Radio className="h-4 w-4" />
            {status === "upcoming" ? "Rejoindre" : "Session terminée"}
          </button>
        )}
      </div>
    </div>
  );
}
