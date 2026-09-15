import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizSubmissionSchema } from "@/lib/validations";

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
    include: { questions: true },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });

  const byId = new Map(quiz.questions.map((q) => [q.id, q]));
  let correct = 0;
  const graded = answers.map((a) => {
    const q = byId.get(a.questionId);
    const isCorrect = Boolean(q && a.selectedAnswer === q.correctAnswer);
    if (isCorrect) correct++;
    return {
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect,
      correctAnswer: q?.correctAnswer ?? null,
      explanation: q?.explanation ?? null,
      tip: q?.tip ?? null,
    };
  });

  const total = quiz.questions.length;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);

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
