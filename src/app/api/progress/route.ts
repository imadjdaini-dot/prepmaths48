import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upsertLessonProgress, recomputeCourseProgress } from "@/lib/progress";

const schema = z.object({
  lessonId: z.string().min(1),
  isCompleted: z.boolean().optional(),
  watchedSeconds: z.coerce.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { lessonId, isCompleted, watchedSeconds } = parsed.data;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { chapter: { select: { courseId: true } } },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Séance introuvable" }, { status: 404 });
  }

  await upsertLessonProgress({
    userId: session.user.id,
    lessonId,
    isCompleted,
    watchedSeconds,
  });

  const progress = await recomputeCourseProgress(
    session.user.id,
    lesson.chapter.courseId
  );

  return NextResponse.json({ ok: true, courseProgress: progress.progressPercent });
}
