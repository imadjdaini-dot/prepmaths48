"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, Plus, X } from "lucide-react";

type Option = { value: string; label: string };

/**
 * Création d'une ressource PDF avec upload local (dev) puis enregistrement.
 */
export function ResourceUpload({
  courses,
  lessons,
}: {
  courses: Option[];
  lessons: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec upload");
      setFileUrl(data.url);
      toast.success("Fichier téléversé.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title")),
      fileUrl: fileUrl || String(fd.get("fileUrl")),
      fileType: "PDF",
      courseId: String(fd.get("courseId")) || undefined,
      lessonId: String(fd.get("lessonId")) || undefined,
      allowDownload: fd.get("allowDownload") === "on",
      isPublished: true,
    };
    if (!payload.fileUrl) {
      toast.error("Téléverse un fichier ou saisis une URL.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Ressource ajoutée.");
      setOpen(false);
      setFileUrl("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
        <Plus className="h-4 w-4" /> Nouvelle ressource
      </button>
    );
  }

  return (
    <div className="card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Nouvelle ressource PDF</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Titre</label>
          <div className="input-wrap">
            <input name="title" required placeholder="Ex. Exercices — Dérivation" />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Fichier PDF</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {fileUrl ? `Téléversé : ${fileUrl}` : "Choisir un fichier (PDF, max 25 Mo)"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
          <p className="mono mt-1 text-[11px] text-muted">
            …ou colle une URL : <input name="fileUrl" className="ml-1 w-64 rounded border border-line px-2 py-0.5" placeholder="/demo/exercices.pdf" />
          </p>
        </div>

        <div>
          <label className="field-label">Cours (optionnel)</label>
          <div className="input-wrap">
            <select name="courseId" defaultValue="">
              <option value="">—</option>
              {courses.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label">Séance (optionnel)</label>
          <div className="input-wrap">
            <select name="lessonId" defaultValue="">
              <option value="">—</option>
              {lessons.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-[14px] font-medium sm:col-span-2">
          <input type="checkbox" name="allowDownload" className="h-4 w-4 accent-[color:var(--accent)]" />
          Autoriser le téléchargement
        </label>

        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer la ressource
          </button>
        </div>
      </form>
    </div>
  );
}
