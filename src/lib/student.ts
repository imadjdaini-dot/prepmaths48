import { prisma } from "@/lib/prisma";

/** Agrège les données du tableau de bord élève. */
export async function getDashboardData(userId: string) {
  // حماية وتأكد من وجود المعرّف قبل تنفيذ أي استعلام في Prisma
  if (!userId) {
    return null;
  }

  const [user, courseProgress, lastProgress, attempts, watched] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.courseProgress.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lessonProgress.findFirst({
      where: { userId },
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

  // إذا لم يتم العثور على المستخدم في قاعدة البيانات
  if (!user) {
    return null;
  }

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

  const cps = await prisma.courseProgress.findMany({
    where: { userId },
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