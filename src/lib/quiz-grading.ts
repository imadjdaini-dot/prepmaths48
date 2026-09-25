import type { Question } from "@prisma/client";

type Submitted = { questionId: string; selectedAnswer: string | null };

/**
 * Correction d'un quiz côté serveur, partagée par /api/quiz/submit et
 * /api/daily-challenge/submit. Le score est un pourcentage 0-100.
 */
export function gradeQuiz(questions: Question[], answers: Submitted[]) {
  const byId = new Map(questions.map((q) => [q.id, q]));
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

  const total = questions.length;
  const score = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { graded, correct, total, score };
}
