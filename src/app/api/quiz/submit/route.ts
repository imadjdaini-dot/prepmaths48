import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizSubmissionSchema } from "@/lib/validations";
import { canSeeCourse, getAudience } from "@/lib/content-access";
import { canAccessLesson, canAccessPremiumCourse } from "@/lib/permissions";
import { gradeQuiz } from "@/lib/quiz-grading";
import type { SessionUser } from "@/types";

/**
 * Corrige un quiz côté serveur (la bonne réponse n'est jamais envoyée au
 * client avant soumission), enregistre la tentative et renvoie le détail.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = quizSubmissionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const { quizId, answers, duration } = parsed.data;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      course: true,
      lesson: { include: { chapter: { include: { course: true } } } },
    },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });

  // Visibilité par niveau / branche (404 pour ne pas révéler l'existence).
  const owningCourse = quiz.lesson?.chapter.course ?? quiz.course;
  const audience = await getAudience(session.user.id);
  const visible =
    audience !== null &&
    (owningCourse ? canSeeCourse(audience, owningCourse) : audience.role === "ADMIN");
  if (!visible) {
    return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
  }

  // Même contrôle premium que la page du quiz : sans lui, un non-abonné pourrait
  // soumettre des réponses et recevoir les bonnes réponses + explications.
  let allowed = true;
  if (quiz.lesson) {
    allowed = await canAccessLesson(session.user as SessionUser, {
      isFreePreview: quiz.lesson.isFreePreview,
      courseIsPremium: quiz.lesson.chapter.course.isPremium,
      courseKind: quiz.lesson.chapter.course.kind,
    });
  } else if (quiz.course?.isPremium) {
    allowed = await canAccessPremiumCourse(session.user as SessionUser, quiz.course.kind);
  }
  if (!allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { graded, correct, total, score } = gradeQuiz(quiz.questions, answers);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score,
      totalQuestions: total,
      correctAnswers: correct,
      wrongAnswers: total - correct,
      duration,
      answers: {
        create: graded.map((g) => ({
          questionId: g.questionId,
          selectedAnswer: g.selectedAnswer,
          isCorrect: g.isCorrect,
        })),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    attemptId: attempt.id,
    score,
    correct,
    total,
    results: graded,
  });
}
