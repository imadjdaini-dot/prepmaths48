import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyVideoToken } from "@/lib/video";
import { canAccessLesson } from "@/lib/permissions";
import type { SessionUser } from "@/types";

/**
 * Proxy vidéo sécurisé (provider LOCAL).
 * - Exige un jeton signé valide ET lié à l'utilisateur connecté.
 * - Ne renvoie jamais l'URL source : on streame le flux upstream.
 * - Supporte les requêtes Range pour le seek.
 */
export async function GET(
  req: Request,
  { params }: { params: { lessonId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Jeton manquant" }, { status: 403 });

  const decoded = verifyVideoToken(token);
  if (
    !decoded ||
    decoded.lessonId !== params.lessonId ||
    decoded.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Jeton invalide ou expiré" }, { status: 403 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { chapter: { include: { course: true } } },
  });
  if (!lesson || !lesson.videoUrl) {
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  // Vérification d'accès côté serveur (premium / preview).
  const allowed = await canAccessLesson(session.user as SessionUser, {
    isFreePreview: lesson.isFreePreview,
    courseIsPremium: lesson.chapter.course.isPremium,
    courseKind: lesson.chapter.course.kind,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Streaming proxy vers la source (l'URL réelle reste cachée du client).
  const range = req.headers.get("range") ?? undefined;
  const upstream = await fetch(lesson.videoUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Source indisponible" }, { status: 502 });
  }

  const headers = new Headers();
  const passthrough = ["content-type", "content-length", "content-range", "accept-ranges"];
  passthrough.forEach((h) => {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  });
  if (!headers.has("content-type")) headers.set("content-type", "video/mp4");
  headers.set("Cache-Control", "private, no-store");
  // Empêche le téléchargement « facile ».
  headers.set("Content-Disposition", "inline");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
