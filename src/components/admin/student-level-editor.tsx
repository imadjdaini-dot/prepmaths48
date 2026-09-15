"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Loader2, X } from "lucide-react";
import type { Level, Track } from "@prisma/client";
import { LevelTrackFields } from "@/components/forms/level-track-fields";
import { formatLevelTrack } from "@/types";

/**
 * Niveau & branche d'un élève, modifiables par l'admin uniquement
 * (l'élève les voit en lecture seule dans son profil).
 */
export function StudentLevelEditor({
  userId,
  level,
  track,
}: {
  userId: string;
  level: Level | null;
  track: Track | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: String(fd.get("level")) || null,
          track: String(fd.get("track")) || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Niveau mis à jour.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-line-2 px-2.5 py-1.5 text-[12px] font-semibold text-ink-2 hover:bg-line"
        title="Modifier le niveau et la branche"
      >
        <GraduationCap className="h-3.5 w-3.5" />
        {formatLevelTrack(level, track) || "Niveau non défini"}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-wrap items-end gap-3 rounded-md border border-line bg-surface-2 p-3 sm:w-auto"
    >
      <LevelTrackFields initialLevel={level} initialTrack={track} allowEmpty />
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost btn-sm"
          aria-label="Annuler"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
