import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson, canAccessPremiumCourse } from "@/lib/permissions";
import { canSeeCourse, getAudience } from "@/lib/content-access";
import type { SessionUser } from "@/types";

/**
 * Sert un fichier ressource (PDF) de façon protégée :
 * - exige une session ;
 * - vérifie l'accès premium / preview côté serveur ;
 * - n'autorise le téléchargement que si allowDownload est vrai ;
 * - ne renvoie jamais l'URL source directement.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const resource = await prisma.resource.findUnique({
    where: { id: params.id },
    include: {
      lesson: { include: { chapter: { include: { course: true } } } },
      course: true,
    },
  });
  if (!resource || !resource.isPublished) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  // Visibilité par niveau / branche (404 pour ne pas révéler l'existence).
  const owningCourse = resource.lesson?.chapter.course ?? resource.course;
  const audience = await getAudience(session.user.id);
  const visible =
    audience !== null &&
    (owningCourse ? canSeeCourse(audience, owningCourse) : audience.role === "ADMIN");
  if (!visible) {
    return NextResponse.json({ error: "Ressource introuvable" }, { status: 404 });
  }

  // Contrôle d'accès
  let allowed = true;
  if (resource.lesson) {
    allowed = await canAccessLesson(session.user as SessionUser, {
      isFreePreview: resource.lesson.isFreePreview,
      courseIsPremium: resource.lesson.chapter.course.isPremium,
      courseKind: resource.lesson.chapter.course.kind,
    });
  } else if (resource.course?.isPremium) {
    allowed = await canAccessPremiumCourse(session.user as SessionUser, resource.course.kind);
  }
  if (!allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const wantDownload = new URL(req.url).searchParams.get("download") === "1";
  if (wantDownload && !resource.allowDownload) {
    return NextResponse.json(
      { error: "Téléchargement non autorisé pour cette ressource." },
      { status: 403 }
    );
  }

  // Récupère le contenu (fichier local public ou URL distante)
  let bytes: Buffer;
  try {
    if (resource.fileUrl.startsWith("http")) {
      const r = await fetch(resource.fileUrl);
      if (!r.ok) throw new Error("upstream");
      bytes = Buffer.from(await r.arrayBuffer());
    } else {
      const safe = resource.fileUrl.replace(/^\/+/, "").replace(/\.\./g, "");
      bytes = await readFile(path.join(process.cwd(), "public", safe));
    }
  } catch {
    return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", resource.fileType === "PDF" ? "application/pdf" : "application/octet-stream");
  headers.set("Cache-Control", "private, no-store");
  headers.set(
    "Content-Disposition",
    `${wantDownload ? "attachment" : "inline"}; filename="${resource.title.replace(/[^a-z0-9]+/gi, "_")}.pdf"`
  );

  return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
}
