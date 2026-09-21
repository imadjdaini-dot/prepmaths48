import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  FileText,
  HelpCircle,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { canAccessPremiumCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canSeeCourse, getAudience } from "@/lib/content-access";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { formatLevelTrack } from "@/types";
import type { SessionUser } from "@/types";

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: { resources: true, quizzes: true },
          },
        },
      },
      resources: { where: { isPublished: true, lessonId: null } },
      quizzes: { where: { isPublished: true, lessonId: null } },
    },
  });

  if (!course || (!course.isPublished && user.role !== "ADMIN")) notFound();

  // Visibilité par niveau / branche : 404 pour un cours hors périmètre.
  const audience = await getAudience(user.id);
  if (!audience || !canSeeCourse(audience, course)) notFound();

  const hasPremium = await canAccessPremiumCourse(user as SessionUser, course.kind);
  const progressMap = new Map(
    (
      await prisma.lessonProgress.findMany({
        where: {
          userId: user.id,
          lesson: { chapter: { courseId: course.id } },
        },
      })
    ).map((p) => [p.lessonId, p])
  );

  const allLessons = course.chapters.flatMap((c) => c.lessons);
  const totalDuration = allLessons.reduce((s, l) => s + l.duration, 0);
  const completed = allLessons.filter((l) => progressMap.get(l.id)?.isCompleted).length;
  const progressPercent =
    allLessons.length === 0 ? 0 : Math.round((completed / allLessons.length) * 100);

  const isLocked = (isFreePreview: boolean) =>
    course.isPremium && !isFreePreview && !hasPremium;

  // Première séance à reprendre (non terminée + accessible)
  const continueLesson =
    allLessons.find((l) => !progressMap.get(l.id)?.isCompleted && !isLocked(l.isFreePreview)) ??
    allLessons.find((l) => !isLocked(l.isFreePreview));

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-muted">
        <Link href="/catalogue" className="hover:text-ink">
          Catalogue
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink">{course.title}</span>
      </nav>

      {/* En-tête cours */}
      <header className="card overflow-hidden shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {course.isPremium ? (
                <Badge variant="premium">Premium</Badge>
              ) : (
                <Badge variant="free">Gratuit</Badge>
              )}
              {course.kind === "CONCOURS" && (
                <Badge variant="new" icon={false}>
                  Concours
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-[clamp(26px,3vw,36px)] font-semibold">
              {course.title}
            </h1>
            <p className="mt-2 whitespace-pre-line text-[15.5px] text-ink-2">
              {course.description}
            </p>
            <div className="mono mt-4 flex flex-wrap gap-4 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" /> {allLessons.length} séances
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {formatDuration(totalDuration)}
              </span>
              {course.level && (
                <span className="inline-flex items-center gap-1.5">
                  {formatLevelTrack(course.level, course.track)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-md border border-line bg-surface-2 p-5">
            <span className="text-[13px] font-medium text-muted">Ta progression</span>
            <div className="mt-1 font-display text-[30px] font-bold">{progressPercent}%</div>
            <ProgressBar value={progressPercent} className="mt-2" />
            <p className="mono mt-2 text-[11px] text-muted">
              {completed}/{allLessons.length} séances terminées
            </p>
            {continueLesson && (
              <ButtonLink href={`/learn/${continueLesson.id}`} className="mt-4 w-full">
                {progressPercent > 0 ? "Continuer" : "Commencer"}{" "}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            )}
            {course.isPremium && !hasPremium && (
              <ButtonLink href="/pricing" variant="ghost" size="sm" className="mt-2 w-full">
                <Lock className="h-4 w-4" /> Débloquer le premium
              </ButtonLink>
            )}
          </div>
        </div>
      </header>

      {/* Ressources & quiz globaux */}
      {(course.resources.length > 0 || course.quizzes.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {course.resources.map((r) => (
            <Link
              key={r.id}
              href={`/resources/${r.id}`}
              className="card flex items-center gap-3 p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-accent-soft text-accent-2">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{r.title}</p>
                <p className="mono text-[11px] text-muted">Fiche PDF du cours</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
          {course.quizzes.map((q) => (
            <Link
              key={q.id}
              href={`/quiz/${q.id}`}
              className="card flex items-center gap-3 p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-navy text-accent">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{q.title}</p>
                <p className="mono text-[11px] text-muted">Quiz du cours</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      )}

      {/* Programme */}
      <section className="space-y-4">
        <h2 className="font-display text-[20px] font-semibold">Programme du cours</h2>
        {course.chapters.map((chapter, ci) => (
          <div key={chapter.id} className="card overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 border-b border-line-2 bg-surface-2 px-5 py-3.5">
              <span className="mono grid h-7 w-7 place-items-center rounded-md bg-navy text-[12px] font-bold text-white">
                {ci + 1}
              </span>
              <h3 className="font-display text-[16px] font-semibold">{chapter.title}</h3>
              <span className="mono ml-auto text-[11px] text-muted">
                {chapter.lessons.length} séances
              </span>
            </div>
            <ul className="divide-y divide-line-2">
              {chapter.lessons.map((lesson) => {
                const prog = progressMap.get(lesson.id);
                const locked = isLocked(lesson.isFreePreview);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={locked ? "/pricing" : `/learn/${lesson.id}`}
                      className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-surface-2"
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                          prog?.isCompleted
                            ? "bg-green/15 text-green"
                            : locked
                              ? "bg-line-2 text-muted"
                              : "bg-accent-soft text-accent-2"
                        }`}
                      >
                        {prog?.isCompleted ? (
                          <CheckCircle2 className="h-[18px] w-[18px]" />
                        ) : locked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <PlayCircle className="h-[18px] w-[18px]" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-ink">
                          {lesson.title}
                        </p>
                        <div className="mono flex items-center gap-2 text-[11px] text-muted">
                          <span>{formatDuration(lesson.duration)}</span>
                          {lesson.isFreePreview && (
                            <span className="text-green">· Aperçu gratuit</span>
                          )}
                          {lesson.resources.length > 0 && (
                            <span>· {lesson.resources.length} PDF</span>
                          )}
                          {lesson.quizzes.length > 0 && <span>· quiz</span>}
                        </div>
                      </div>
                      {locked && <span className="badge badge-premium">Premium</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
