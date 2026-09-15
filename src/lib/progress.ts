import { prisma } from "@/lib/prisma";

/**
 * Recalcule et persiste la progression d'un cours pour un utilisateur
 * (appelé après qu'une leçon est marquée terminée).
 */
export async function recomputeCourseProgress(userId: string, courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { chapter: { courseId }, isPublished: true },
    select: { id: true },
  });
  const totalLessons = lessons.length;
  const lessonIds = lessons.map((l) => l.id);

  const completedLessons =
    lessonIds.length === 0
      ? 0
      : await prisma.lessonProgress.count({
          where: { userId, lessonId: { in: lessonIds }, isCompleted: true },
        });

  const progressPercent =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  return prisma.courseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, totalLessons, completedLessons, progressPercent },
    update: { totalLessons, completedLessons, progressPercent },
  });
}

/** Marque une leçon comme terminée (ou met à jour les secondes vues). */
export async function upsertLessonProgress(opts: {
  userId: string;
  lessonId: string;
  isCompleted?: boolean;
  watchedSeconds?: number;
}) {
  const { userId, lessonId, isCompleted, watchedSeconds } = opts;
  return prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      isCompleted: isCompleted ?? false,
      watchedSeconds: watchedSeconds ?? 0,
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      ...(isCompleted !== undefined
        ? { isCompleted, completedAt: isCompleted ? new Date() : null }
        : {}),
      ...(watchedSeconds !== undefined ? { watchedSeconds } : {}),
    },
  });
}
