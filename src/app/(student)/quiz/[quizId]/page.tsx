import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, Target } from "lucide-react";
import { requireUser, canAccessLesson, canAccessPremiumCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { canSeeCourse, getAudience } from "@/lib/content-access";
import { findTodayChallenge } from "@/lib/daily-challenge";
import { QuizRunner, type QuizQuestion } from "@/components/quiz/quiz-runner";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import type { SessionUser } from "@/types";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: { quizId: string };
  searchParams: { dailyChallengeId?: string | string[] };
}) {
  const user = await requireUser();

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      lesson: { include: { chapter: { include: { course: true } } } },
      course: true,
    },
  });
  if (!quiz || !quiz.isPublished) notFound();

  const audience = await getAudience(user.id);

  // Contexte « défi du jour » : le défi doit être celui d'aujourd'hui pour cet
  // élève et porter sur ce quiz. L'admin l'ayant assigné à ce public, on ne
  // refait pas les contrôles de visibilité / premium du quiz dans ce cas.
  const dailyChallengeId =
    typeof searchParams.dailyChallengeId === "string" ? searchParams.dailyChallengeId : null;
  if (dailyChallengeId) {
    const challenge = audience ? await findTodayChallenge(audience) : null;
    if (!challenge || challenge.id !== dailyChallengeId || challenge.quizId !== quiz.id) {
      return (
        <ChallengeNotice
          title="Ce défi n'est plus disponible"
          description="Le défi du jour change chaque jour. Retrouve celui d'aujourd'hui sur ton tableau de bord."
        />
      );
    }
    const attempt = await prisma.dailyChallengeAttempt.findUnique({
      where: { userId_dailyChallengeId: { userId: user.id, dailyChallengeId } },
    });
    if (attempt) {
      return (
        <ChallengeNotice
          title="Défi déjà fait aujourd'hui"
          description={`Terminé ✅ — ${attempt.pointsEarned} points (score ${attempt.score}%). Reviens demain pour le prochain défi.`}
        />
      );
    }
  } else {
    // Visibilité par niveau / branche : 404 pour un quiz hors périmètre.
    const owningCourse = quiz.lesson?.chapter.course ?? quiz.course;
    const visible =
      audience !== null &&
      (owningCourse ? canSeeCourse(audience, owningCourse) : audience.role === "ADMIN");
    if (!visible) notFound();

    // Contrôle d'accès premium
    let allowed = true;
    if (quiz.lesson) {
      allowed = await canAccessLesson(user as SessionUser, {
        isFreePreview: quiz.lesson.isFreePreview,
        courseIsPremium: quiz.lesson.chapter.course.isPremium,
        courseKind: quiz.lesson.chapter.course.kind,
      });
    } else if (quiz.course?.isPremium) {
      allowed = await canAccessPremiumCourse(user as SessionUser, quiz.course.kind);
    }
    if (!allowed) redirect("/pricing");
  }

  const course = quiz.lesson?.chapter.course ?? quiz.course;

  const questions: QuizQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    statement: q.statement,
    difficulty: q.difficulty,
    options: [
      { key: "A", text: q.optionA },
      { key: "B", text: q.optionB },
      ...(q.optionC ? [{ key: "C", text: q.optionC }] : []),
      ...(q.optionD ? [{ key: "D", text: q.optionD }] : []),
      ...(q.optionE ? [{ key: "E", text: q.optionE }] : []),
    ],
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-muted">
        {dailyChallengeId ? (
          <>
            <Link href="/dashboard" className="hover:text-ink">
              Défi du jour
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        ) : (
          course && (
            <>
              <Link href={`/courses/${course.slug}`} className="hover:text-ink">
                {course.title}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )
        )}
        <span className="text-ink">{quiz.title}</span>
      </nav>

      <div>
        <h1 className="font-display text-[26px] font-semibold">{quiz.title}</h1>
        {quiz.description && <p className="mt-1 text-[15px] text-muted">{quiz.description}</p>}
        {dailyChallengeId && (
          <p className="mt-2 text-[14px] font-medium text-accent-2">
            Défi du jour : une seule tentative, réfléchis bien avant de valider.
          </p>
        )}
      </div>

      {questions.length === 0 ? (
        <EmptyState title="Quiz vide" description="Aucune question pour le moment." />
      ) : (
        <QuizRunner
          quizId={quiz.id}
          title={quiz.title}
          questions={questions}
          dailyChallengeId={dailyChallengeId ?? undefined}
        />
      )}
    </div>
  );
}

function ChallengeNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <EmptyState
        icon={<Target className="h-6 w-6" />}
        title={title}
        description={description}
        action={<ButtonLink href="/classement">Voir le classement</ButtonLink>}
      />
    </div>
  );
}
