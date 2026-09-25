import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dailyChallengeSubmissionSchema } from "@/lib/validations";
import { getAudience } from "@/lib/content-access";
import { challengePoints, findTodayChallenge } from "@/lib/daily-challenge";
import { gradeQuiz } from "@/lib/quiz-grading";

/**
 * Corrige le défi du jour et enregistre l'unique tentative de l'élève.
 * Le défi a été choisi par l'admin pour ce public : on ne refait pas ici les
 * contrôles de visibilité / premium du quiz, seulement « est-ce bien SON défi
 * d'aujourd'hui ? ».
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = dailyChallengeSubmissionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const { dailyChallengeId, answers } = parsed.data;

  const audience = await getAudience(session.user.id);
  const challenge = audience ? await findTodayChallenge(audience) : null;
  // Défi d'hier (minuit passé pendant le quiz) ou défi d'un autre niveau.
  if (!challenge || challenge.id !== dailyChallengeId) {
    return NextResponse.json(
      { error: "Ce défi n'est plus disponible aujourd'hui" },
      { status: 404 }
    );
  }

  const questions = await prisma.question.findMany({ where: { quizId: challenge.quizId } });
  const { graded, correct, total, score } = gradeQuiz(questions, answers);
  const pointsEarned = challengePoints(score);

  try {
    await prisma.dailyChallengeAttempt.create({
      data: { userId: session.user.id, dailyChallengeId, score, pointsEarned },
    });
  } catch (e) {
    // @@unique([userId, dailyChallengeId]) : une seule tentative par défi.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Défi déjà fait aujourd'hui" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, score, correct, total, pointsEarned, results: graded });
}
