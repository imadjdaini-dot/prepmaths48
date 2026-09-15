"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LEVELS, LEVEL_LABELS, TRACK_LABELS, TRACKS, TRACKS_BY_LEVEL, isLevel, isTrack } from "@/types";

const PREMIUM_OPTIONS = [
  { v: "", l: "Tous" },
  { v: "free", l: "Gratuit" },
  { v: "premium", l: "Premium" },
];

export function CatalogueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParams(patch: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  const current = (k: string) => params.get(k) ?? "";
  const level = current("level");
  // Les branches proposées dépendent du niveau ; sans niveau, toutes.
  // Tronc commun n'a pas de branche : le sélecteur est alors désactivé.
  const tracks = isLevel(level) ? TRACKS_BY_LEVEL[level] : TRACKS;
  const hasTracks = tracks.length > 0;

  function onLevelChange(v: string) {
    const track = current("track");
    const keepTrack = !isLevel(v) || (isTrack(track) && TRACKS_BY_LEVEL[v].includes(track));
    setParams({ level: v, track: keepTrack ? track : "" });
  }

  return (
    <div className="grid gap-3 rounded-md border border-line bg-surface p-4 shadow-sm sm:grid-cols-3">
      <Select
        label="Niveau"
        value={level}
        onChange={onLevelChange}
        options={[{ v: "", l: "Tous" }, ...LEVELS.map((l) => ({ v: l, l: LEVEL_LABELS[l] }))]}
      />
      <Select
        label="Branche"
        value={current("track")}
        onChange={(v) => setParams({ track: v })}
        disabled={!hasTracks}
        options={[
          { v: "", l: hasTracks ? "Toutes" : "Aucune branche" },
          ...tracks.map((t) => ({ v: t, l: TRACK_LABELS[t] })),
        ]}
      />
      <Select
        label="Accès"
        value={current("premium")}
        onChange={(v) => setParams({ premium: v })}
        options={PREMIUM_OPTIONS}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="input-wrap">
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
          {options.map((o) => (
            <option key={o.v} value={o.v}>
              {o.l}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
