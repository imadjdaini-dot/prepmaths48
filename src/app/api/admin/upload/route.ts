import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { guardAdmin } from "@/lib/admin-guard";
import { slugify } from "@/lib/utils";

/**
 * Upload de fichier (dev : stockage local dans public/uploads).
 * En production, brancher S3 / Bunny / R2 ici et renvoyer l'URL distante.
 */
export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 400 });
  }

  const ext = path.extname(file.name) || "";
  const base = slugify(path.basename(file.name, ext)) || "fichier";
  const name = `${base}-${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
