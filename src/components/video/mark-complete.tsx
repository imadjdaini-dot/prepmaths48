"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export function MarkComplete({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !completed;
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, isCompleted: next }),
      });
      if (!res.ok) throw new Error();
      setCompleted(next);
      toast.success(next ? "Séance marquée comme terminée 🎉" : "Marquée comme à revoir.");
      router.refresh();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn w-full ${completed ? "btn-ghost" : "btn-primary"}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {completed ? "Terminé — revoir" : "Marquer comme terminé"}
    </button>
  );
}
