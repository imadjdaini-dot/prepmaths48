"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";
import { LevelTrackFields } from "@/components/forms/level-track-fields";
import { todayDay } from "@/lib/school-year";

/**
 * Création d'un défi du jour : panneau repliable, poste un JSON vers
 * /api/admin/daily-challenge, rafraîchit la liste.
 */
export function DailyChallengeForm({ quizzes }: { quizzes: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      date: String(fd.get("date")),
      quizId: String(fd.get("quizId")),
      level: String(fd.get("level") ?? "") || null,
      track: String(fd.get("track") ?? "") || null,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/admin/daily-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Défi du jour créé.");
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
        <Plus className="h-4 w-4" /> Nouveau défi
      </button>
    );
  }

  return (
    <div className="card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Nouveau défi du jour</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Date</label>
          <div className="input-wrap">
            <input name="date" type="date" required defaultValue={todayDay()} />
          </div>
        </div>
        <div>
          <label className="field-label">Quiz</label>
          <div className="input-wrap">
            <select name="quizId" required defaultValue="">
              <option value="" disabled>
                Choisir un quiz…
              </option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <LevelTrackFields allowEmpty emptyTrackLabel="Toutes branches" />
        <p className="-mt-2 text-[12px] text-muted sm:col-span-2">
          Laisse « — » pour un défi général. Un élève reçoit le défi le plus précis qui le
          concerne : niveau + branche, sinon niveau, sinon général.
        </p>

        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer le défi
          </button>
        </div>
      </form>
    </div>
  );
}
