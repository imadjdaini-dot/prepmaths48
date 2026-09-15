"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";

export function LessonNotes({
  lessonId,
  initial,
}: {
  lessonId: string;
  initial: string;
}) {
  const [content, setContent] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notes enregistrées.");
    } catch {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="Tes notes personnelles sur cette séance…"
        className="w-full resize-y rounded-md border border-line bg-surface p-3 text-[14px] text-ink outline-none focus:border-accent"
      />
      <button onClick={save} disabled={saving} className="btn btn-ghost btn-sm mt-2">
        <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer mes notes"}
      </button>
    </div>
  );
}
