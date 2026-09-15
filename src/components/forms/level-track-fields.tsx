"use client";

import { useState } from "react";
import type { Level, Track } from "@prisma/client";
import { LEVELS, LEVEL_LABELS, TRACK_LABELS, TRACKS_BY_LEVEL, isLevel, isTrack } from "@/types";

/**
 * Paire de sélecteurs « Niveau » + « Branche » : les branches proposées
 * dépendent du niveau (SM / S.Ex pour le lycée, Médecine / ENSA pour Concours).
 * Les valeurs sont soumises via les champs `level` et `track` du formulaire
 * parent ("" = non renseigné).
 */
export function LevelTrackFields({
  initialLevel,
  initialTrack,
  allowEmpty = false,
  emptyTrackLabel = "—",
  trackLabel = "Branche",
}: {
  initialLevel?: string | null;
  initialTrack?: string | null;
  /** Autorise « — » pour le niveau (profil, cours sans niveau). */
  allowEmpty?: boolean;
  /** Libellé de l'option vide pour la branche (ex. « Toutes branches »). */
  emptyTrackLabel?: string;
  trackLabel?: string;
}) {
  const [level, setLevel] = useState<Level | "">(
    isLevel(initialLevel) ? initialLevel : allowEmpty ? "" : "BAC_2"
  );
  const [track, setTrack] = useState<Track | "">(isTrack(initialTrack) ? initialTrack : "");

  const tracks = level ? TRACKS_BY_LEVEL[level] : [];
  // Tronc commun n'a pas de branche : le second sélecteur est désactivé.
  const hasTracks = tracks.length > 0;

  function onLevelChange(v: string) {
    const next = isLevel(v) ? v : "";
    setLevel(next);
    // Une branche qui n'appartient plus au niveau est réinitialisée.
    if (track && (!next || !TRACKS_BY_LEVEL[next].includes(track))) setTrack("");
  }

  return (
    <>
      <div>
        <label className="field-label">Niveau</label>
        <div className="input-wrap">
          <select name="level" value={level} onChange={(e) => onLevelChange(e.target.value)}>
            {allowEmpty && <option value="">—</option>}
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="field-label">{trackLabel}</label>
        <div className="input-wrap">
          <select
            name="track"
            value={track}
            onChange={(e) => setTrack(isTrack(e.target.value) ? e.target.value : "")}
            disabled={!hasTracks}
          >
            <option value="">{hasTracks ? emptyTrackLabel : level ? "Aucune branche" : "—"}</option>
            {tracks.map((t) => (
              <option key={t} value={t}>
                {TRACK_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
