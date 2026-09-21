"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Upload, Loader2 } from "lucide-react";
import { LevelTrackFields } from "@/components/forms/level-track-fields";

type CourseValues = {
  id?: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  level: string;
  track: string;
  isPremium: boolean;
  isPublished: boolean;
  order: number;
};

export function CourseForm({ initial }: { initial?: Partial<CourseValues> }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [loading, setLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [uploading, setUploading] = useState(false);

  async function uploadThumbnail(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec upload");
      setThumbnailUrl(data.url);
      toast.success("Image téléversée.");
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
      description: String(fd.get("description")),
      shortDescription: String(fd.get("shortDescription")),
      thumbnailUrl: thumbnailUrl || String(fd.get("thumbnailUrl")),
      // Le type (Cours / Concours) est dérivé du niveau côté serveur.
      level: String(fd.get("level")) || null,
      track: String(fd.get("track")) || null,
      isPremium: fd.get("isPremium") === "on",
      isPublished: fd.get("isPublished") === "on",
      order: Number(fd.get("order") || 0),
    };

    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/courses/${initial!.id}` : "/api/admin/courses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success(isEdit ? "Cours mis à jour." : "Cours créé.");
      router.push("/admin/courses");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 shadow-sm">
      <div>
        <label className="field-label">Titre</label>
        <div className="input-wrap">
          <input name="title" defaultValue={initial?.title ?? ""} required />
        </div>
      </div>

      <div>
        <label className="field-label">Description courte</label>
        <div className="input-wrap">
          <input
            name="shortDescription"
            defaultValue={initial?.shortDescription ?? ""}
            placeholder="Une phrase d'accroche"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Description complète</label>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          rows={5}
          required
          className="w-full resize-y rounded-md border border-line bg-surface p-3 text-[15px] outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LevelTrackFields
          initialLevel={initial?.level}
          initialTrack={initial?.track}
          emptyTrackLabel="Toutes branches"
        />
      </div>
      <p className="-mt-2 text-[12px] text-muted">
        Le niveau « Concours » classe le cours dans l&apos;offre Concours ; les autres niveaux dans
        l&apos;offre Cours.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Image miniature</label>
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt=""
              className="mb-2 h-24 w-full rounded-md border border-line object-cover"
            />
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line bg-surface-2 px-3 py-2.5 text-[13px] text-ink-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {thumbnailUrl ? "Changer l'image" : "Choisir une image (JPG, PNG, WebP)"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadThumbnail(e.target.files[0])}
            />
          </label>
          <p className="mono mt-1 text-[11px] text-muted">
            …ou colle une URL :{" "}
            <input
              name="thumbnailUrl"
              defaultValue={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="ml-1 w-56 rounded border border-line px-2 py-0.5"
              placeholder="https://…"
            />
          </p>
        </div>
        <div>
          <label className="field-label">Ordre d&apos;affichage</label>
          <div className="input-wrap">
            <input name="order" type="number" min={0} defaultValue={initial?.order ?? 0} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2.5 text-[14px] font-medium">
          <input
            type="checkbox"
            name="isPremium"
            defaultChecked={initial?.isPremium ?? true}
            className="h-4 w-4 accent-[color:var(--accent)]"
          />
          Cours premium
        </label>
        <label className="flex items-center gap-2.5 text-[14px] font-medium">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={initial?.isPublished ?? false}
            className="h-4 w-4 accent-[color:var(--accent)]"
          />
          Publié
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        <Save className="h-4 w-4" /> {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le cours"}
      </button>
    </form>
  );
}