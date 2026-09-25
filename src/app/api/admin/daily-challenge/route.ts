import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { dailyChallengeSchema } from "@/lib/validations";
import { dayNoon } from "@/lib/school-year";

const DUPLICATE_ERROR = "Un défi existe déjà pour cette date et ce ciblage";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = dailyChallengeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const date = dayNoon(d.date);
  const level = d.level ?? null;
  const track = d.track ?? null;

  const quiz = await prisma.quiz.findUnique({
    where: { id: d.quizId },
    select: { isPublished: true, _count: { select: { questions: true } } },
  });
  if (!quiz || !quiz.isPublished || quiz._count.questions === 0) {
    return NextResponse.json(
      { error: "Choisis un quiz publié qui contient des questions" },
      { status: 400 }
    );
  }

  // @@unique([date, level, track]) ne bloque pas les doublons contenant un NULL
  // (PostgreSQL : NULL ≠ NULL) : on vérifie donc explicitement avant de créer.
  const existing = await prisma.dailyChallenge.findFirst({ where: { date, level, track } });
  if (existing) {
    return NextResponse.json({ error: DUPLICATE_ERROR }, { status: 409 });
  }

  try {
    const challenge = await prisma.dailyChallenge.create({
      data: { date, quizId: d.quizId, level, track },
    });
    return NextResponse.json({ ok: true, id: challenge.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: DUPLICATE_ERROR }, { status: 409 });
    }
    throw e;
  }
}
