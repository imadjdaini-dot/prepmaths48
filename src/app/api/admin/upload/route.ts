import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "node:path";
import { guardAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

// Extensions acceptées : PDF (ressources) + images (miniatures de cours).
// Le disque du serveur Vercel est éphémère — writeFile() ne persiste pas
// entre deux déploiements. Les fichiers sont donc stockés sur Vercel Blob.
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE = 25 * 1024 * 1024; // 25 Mo

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé (PDF ou image uniquement)." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
  }

  const ext = path.extname(file.name) || "";
  const base = slugify(path.basename(file.name, ext)) || "fichier";
  const pathname = `uploads/${base}-${Date.now()}${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    // Nom déjà rendu unique via Date.now() ci-dessus.
    addRandomSuffix: false,
  });

  return NextResponse.json({ ok: true, url: blob.url });
}
