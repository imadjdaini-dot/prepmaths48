"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { formatLevelTrack } from "@/types";
import type { Level, Track } from "@prisma/client";

export function ProfileForm({
  initial,
}: {
  initial: {
    name: string;
    email: string;
    level: Level | null;
    track: Track | null;
    city: string | null;
    school: string | null;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          city: fd.get("city"),
          school: fd.get("school"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur");
      }
      toast.success("Profil mis à jour.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Nom complet</label>
          <div className="input-wrap">
            <input name="name" defaultValue={initial.name} required />
          </div>
        </div>
        <div>
          <label className="field-label">Email</label>
          <div className="input-wrap opacity-70">
            <input value={initial.email} disabled />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Niveau & branche</label>
          <div className="input-wrap opacity-70">
            <input value={formatLevelTrack(initial.level, initial.track) || "Non renseigné"} disabled />
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Défini par l&apos;administration — contacte ton professeur pour le modifier.
          </p>
        </div>
        <div>
          <label className="field-label">Ville</label>
          <div className="input-wrap">
            <input name="city" defaultValue={initial.city ?? ""} placeholder="Casablanca" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Lycée</label>
          <div className="input-wrap">
            <input name="school" defaultValue={initial.school ?? ""} placeholder="Nom du lycée" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        <Save className="h-4 w-4" /> {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
