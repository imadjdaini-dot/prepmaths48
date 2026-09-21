import { prisma } from "@/lib/prisma";
import {
  courseVisibilityWhere,
  getAudience,
  lessonVisibilityWhere,
} from "@/lib/content-access";

/** Agrège les données du tableau de bord élève. */
export async function getDashboardData(userId: string) {
  // حماية وتأكد من وجود المعرّف قبل تنفيذ أي استعلام في Prisma
  if (!userId) {
    return null;
  }

  // On lit d'abord l'élève : son niveau / sa branche servent à filtrer le contenu visible.
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // إذا لم يتم العثور على المستخدم في قاعدة البيانات
  if (!user) {
    return null;
  }

  const [courseProgress, lastProgress, attempts, watched] = await Promise.all([
    prisma.courseProgress.findMany({
      where: { userId, course: courseVisibilityWhere(user) },
      include: { course: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lessonProgress.findFirst({
      where: { userId, lesson: lessonVisibilityWhere(user) },
      orderBy: { updatedAt: "desc" },
      include: {
        lesson: { include: { chapter: { include: { course: true } } } },
      },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { quiz: true },
    }),
    prisma.lessonProgress.aggregate({
      where: { userId },
      _sum: { watchedSeconds: true },
    }),
  ]);

  const inProgress = courseProgress.filter(
    (cp) => cp.progressPercent > 0 && cp.progressPercent < 100
  );
  const completedCourses = courseProgress.filter((cp) => cp.progressPercent >= 100).length;
  const globalProgress =
    courseProgress.length === 0
      ? 0
      : Math.round(
          courseProgress.reduce((s, c) => s + c.progressPercent, 0) /
            courseProgress.length
        );

  return {
    user,
    globalProgress,
    completedCourses,
    enrolledCount: courseProgress.length,
    inProgress,
    lastProgress,
    attempts,
    totalWatchedSeconds: watched._sum.watchedSeconds ?? 0,
  };
}

/** Cours suivis par l'élève (avec progression), pour /courses. */
export async function getMyCourses(userId: string) {
  // حماية وتأكد من وجود المعرّف
  if (!userId) {
    return [];
  }

  // Uniquement les cours visibles pour le niveau / la branche de l'élève.
  const audience = await getAudience(userId);

  const cps = await prisma.courseProgress.findMany({
    where: {
      userId,
      course: courseVisibilityWhere(audience ?? { level: null, track: null }),
    },
    include: {
      course: {
        include: {
          chapters: {
            where: { isPublished: true },
            include: { lessons: { where: { isPublished: true }, select: { duration: true } } },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return cps;
}