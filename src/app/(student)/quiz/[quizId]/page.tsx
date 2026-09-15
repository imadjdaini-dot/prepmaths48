import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { requireUser, canAccessLesson, canAccessPremiumCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { QuizRunner, type QuizQuestion } from "@/components/quiz/quiz-runner";
import { EmptyState } from "@/components/ui/empty-state";
import type { SessionUser } from "@/types";

export default async function QuizPage({
  params,
}: {
  params: { quizId: string };
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
        {course && (
          <>
            <Link href={`/courses/${course.slug}`} className="hover:text-ink">
              {course.title}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="text-ink">{quiz.title}</span>
      </nav>

      <div>
        <h1 className="font-display text-[26px] font-semibold">{quiz.title}</h1>
        {quiz.description && <p className="mt-1 text-[15px] text-muted">{quiz.description}</p>}
      </div>

      {questions.length === 0 ? (
        <EmptyState title="Quiz vide" description="Aucune question pour le moment." />
      ) : (
        <QuizRunner quizId={quiz.id} title={quiz.title} questions={questions} />
      )}
    </div>
  );
}
