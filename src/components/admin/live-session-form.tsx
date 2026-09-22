"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { LevelTrackFields } from "@/components/forms/level-track-fields";

/**
 * Création d'une session live (Google Meet) : panneau repliable, poste un
 * JSON vers /api/admin/live, rafraîchit la liste.
 */
export function LiveSessionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      description: String(fd.get("description") || ""),
      meetUrl: String(fd.get("meetUrl")),
      level: String(fd.get("level")) || null,
      track: String(fd.get("track")) || null,
      startAt: String(fd.get("startAt")),
      durationMinutes: Number(fd.get("durationMinutes") || 60),
      isPublished: fd.get("isPublished") === "on",
    };
    if (!payload.startAt) {
      toast.error("Choisis une date et une heure.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Session live créée.");
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
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
        <Plus className="h-4 w-4" /> Nouvelle session live
      </button>
    );
  }

  return (
    <div className="card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Nouvelle session live</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Titre</label>
          <div className="input-wrap">
            <input name="title" required placeholder="Ex. Séance de révision — Dérivation" />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Description (optionnel)</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Ce qui sera abordé pendant la session…"
            className="w-full resize-y rounded-md border border-line bg-surface p-3 text-[14px] outline-none focus:border-accent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Lien Google Meet</label>
          <div className="input-wrap">
            <input
              name="meetUrl"
              type="url"
              required
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </div>
        </div>

        <LevelTrackFields allowEmpty emptyTrackLabel="Toutes branches" />
        <p className="-mt-2 text-[12px] text-muted sm:col-span-2">
          Laisse « — » pour un niveau ou une branche non précisé afin de viser tous les élèves.
        </p>

        <div>
          <label className="field-label">Date &amp; heure</label>
          <div className="input-wrap">
            <input name="startAt" type="datetime-local" required />
          </div>
        </div>
        <div>
          <label className="field-label">Durée (minutes)</label>
          <div className="input-wrap">
            <input name="durationMinutes" type="number" min={1} max={600} defaultValue={60} />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-[14px] font-medium sm:col-span-2">
          <input type="checkbox" name="isPublished" className="h-4 w-4 accent-[color:var(--accent)]" />
          Publier immédiatement
        </label>

        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer la session
          </button>
        </div>
      </form>
    </div>
  );
}
