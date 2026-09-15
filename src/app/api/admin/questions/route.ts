import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = questionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;
  const question = await prisma.question.create({
    data: {
      quizId: d.quizId,
      statement: d.statement,
      optionA: d.optionA,
      optionB: d.optionB,
      optionC: d.optionC || null,
      optionD: d.optionD || null,
      optionE: d.optionE || null,
      correctAnswer: d.correctAnswer,
      explanation: d.explanation || null,
      tip: d.tip || null,
      difficulty: d.difficulty,
      order: d.order,
    },
  });
  return NextResponse.json({ ok: true, id: question.id });
}
