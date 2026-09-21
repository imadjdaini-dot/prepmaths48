import { prisma } from "@/lib/prisma";
import type { CourseCardData } from "@/components/courses/course-card";
import type { Prisma } from "@prisma/client";
import { isLevel, isTrack } from "@/types";
import { courseVisibilityWhere, type Audience } from "@/lib/content-access";

/** Récupère les cours publiés sous forme de cartes, avec filtres optionnels. */
export async function getCourseCards(filters?: {
  track?: string;
  kind?: string;
  level?: string;
  premium?: "free" | "premium";
  take?: number;
}, audience?: Audience | null): Promise<CourseCardData[]> {
  const where: Prisma.CourseWhereInput = { isPublished: true };
  // Les valeurs viennent de l'URL : on ignore silencieusement celles hors enum.
  if (isTrack(filters?.track)) where.track = filters.track;
  if (filters?.kind === "COURS" || filters?.kind === "CONCOURS") where.kind = filters.kind;
  if (isLevel(filters?.level)) where.level = filters.level;
  if (filters?.premium === "free") where.isPremium = false;
  if (filters?.premium === "premium") where.isPremium = true;

  // Si on connaît l'élève, on restreint à son niveau / sa branche (les filtres d'URL
  // ne peuvent pas contourner cette restriction : combinaison par AND).
  const finalWhere: Prisma.CourseWhereInput = audience
    ? { AND: [where, courseVisibilityWhere(audience)] }
    : where;

  const courses = await prisma.course.findMany({
    where: finalWhere,
    orderBy: { order: "asc" },
    take: filters?.take,
    include: {
      chapters: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            select: { duration: true },
          },
        },
      },
    },
  });

  return courses.map((c) => {
    const lessons = c.chapters.flatMap((ch) => ch.lessons);
    return {
      slug: c.slug,
      title: c.title,
      shortDescription: c.shortDescription,
      level: c.level,
      track: c.track,
      kind: c.kind,
      isPremium: c.isPremium,
      lessonCount: lessons.length,
      totalDuration: lessons.reduce((s, l) => s + l.duration, 0),
    };
  });
}
