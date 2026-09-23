import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Lock,
} from "lucide-react";
import { requireUser, canAccessLesson } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canSeeCourse, getAudience } from "@/lib/content-access";
import { signVideoToken, buildPlaybackSource } from "@/lib/video";
import { VideoPlayer } from "@/components/video/video-player";
import { LessonNotes } from "@/components/video/lesson-notes";
import { MarkComplete } from "@/components/video/mark-complete";
import { ButtonLink } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { MathText } from "@/components/ui/math-text";
import type { SessionUser } from "@/types";

export default async function LearnPage({
  params,
}: {
  params: { lessonId: string };
}) {
  const user = await requireUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: {
      resources: { where: { isPublished: true } },
      quizzes: { where: { isPublished: true } },
      chapter: {
        include: {
          course: {
            include: {
              chapters: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.isPublished) notFound();

  const course = lesson.chapter.course;

  // Visibilité par niveau / branche : 404 (et non /pricing) pour un contenu hors périmètre.
  const audience = await getAudience(user.id);
  if (!audience || !canSeeCourse(audience, course)) notFound();

  const allowed = await canAccessLesson(user as SessionUser, {
    isFreePreview: lesson.isFreePreview,
    courseIsPremium: course.isPremium,
    courseKind: course.kind,
  });
  if (!allowed) redirect("/pricing");

  // Navigation prev/next à plat
  const flat = course.chapters.flatMap((c) => c.lessons);
  const idx = flat.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  const [progress, note] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
    prisma.note.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    }),
  ]);

  const token = signVideoToken(lesson.id, user.id);
  const source = buildPlaybackSource({
    provider: lesson.videoProvider,
    videoUrl: lesson.videoUrl,
    lessonId: lesson.id,
    signedToken: token,
    startSeconds: progress?.isCompleted ? 0 : (progress?.watchedSeconds ?? 0),
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
        <Link href={`/courses/${course.slug}`} className="hover:text-ink">
          {course.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink">{lesson.chapter.title}</span>
      </nav>

      <div className="grid gap-7 lg:grid-cols-[1.6fr_1fr]">
        {/* Colonne principale */}
        <div>
          <VideoPlayer source={source} lessonId={lesson.id} watermark={user.email} />

          <h1 className="mt-5 font-display text-[24px] font-semibold">{lesson.title}</h1>
          <p className="mono mt-1 text-[12px] text-muted">
            {formatDuration(lesson.duration)} · {lesson.chapter.title}
          </p>
          {lesson.description && (
            <MathText className="mt-3 text-[15px] text-ink-2">
              {lesson.description}
            </MathText>
          )}

          {/* Navigation prev/next */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {prev ? (
              <ButtonLink href={`/learn/${prev.id}`} variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" /> Précédent
              </ButtonLink>
            ) : (
              <span />
            )}
            {next ? (
              <ButtonLink href={`/learn/${next.id}`} variant="ghost" size="sm">
                Suivant <ChevronRight className="h-4 w-4" />
              </ButtonLink>
            ) : (
              <ButtonLink href={`/courses/${course.slug}`} variant="ghost" size="sm">
                Retour au cours
              </ButtonLink>
            )}
          </div>

          {/* Notes */}
          <div className="mt-8">
            <h2 className="mb-2 font-display text-[18px] font-semibold">Mes notes</h2>
            <LessonNotes lessonId={lesson.id} initial={note?.content ?? ""} />
          </div>
        </div>

        {/* Colonne latérale */}
        <aside className="space-y-5">
          <div className="card p-5 shadow-sm">
            <MarkComplete
              lessonId={lesson.id}
              initialCompleted={progress?.isCompleted ?? false}
            />
          </div>

          {/* Ressources */}
          {lesson.resources.length > 0 && (
            <div className="card p-5 shadow-sm">
              <h3 className="mb-3 font-display text-[16px] font-semibold">Ressources</h3>
              <div className="space-y-2">
                {lesson.resources.map((r) => (
                  <Link
                    key={r.id}
                    href={`/resources/${r.id}`}
                    className="flex items-center gap-3 rounded-md border border-line-2 px-3 py-2.5 transition hover:bg-surface-2"
                  >
                    <FileText className="h-4 w-4 text-accent-2" />
                    <span className="flex-1 truncate text-[14px]">{r.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quiz lié */}
          {lesson.quizzes.length > 0 && (
            <div className="card p-5 shadow-sm">
              <h3 className="mb-3 font-display text-[16px] font-semibold">Quiz de la séance</h3>
              <div className="space-y-2">
                {lesson.quizzes.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quiz/${q.id}`}
                    className="flex items-center gap-3 rounded-md bg-navy px-3 py-2.5 text-white transition hover:bg-navy-2"
                  >
                    <HelpCircle className="h-4 w-4 text-accent" />
                    <span className="flex-1 truncate text-[14px]">{q.title}</span>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sommaire */}
          <div className="card p-5 shadow-sm">
            <h3 className="mb-3 font-display text-[16px] font-semibold">Sommaire</h3>
            <div className="scroll-thin max-h-80 space-y-1 overflow-y-auto">
              {flat.map((l, i) => (
                <Link
                  key={l.id}
                  href={`/learn/${l.id}`}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[13.5px] ${
                    l.id === lesson.id
                      ? "bg-accent-soft font-semibold text-accent-2"
                      : "text-ink-2 hover:bg-surface-2"
                  }`}
                >
                  <span className="mono w-5 shrink-0 text-[11px] text-muted">{i + 1}</span>
                  <span className="flex-1 truncate">{l.title}</span>
                  {course.isPremium && !l.isFreePreview && (
                    <Lock className="h-3 w-3 text-muted" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}