import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  // Une question reste dans son quiz : quizId n'est pas modifiable ici.
  const parsed = questionSchema.omit({ quizId: true }).partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.question.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const data = {
    ...(d.statement !== undefined ? { statement: d.statement } : {}),
    ...(d.optionA !== undefined ? { optionA: d.optionA } : {}),
    ...(d.optionB !== undefined ? { optionB: d.optionB } : {}),
    ...(d.optionC !== undefined ? { optionC: d.optionC || null } : {}),
    ...(d.optionD !== undefined ? { optionD: d.optionD || null } : {}),
    ...(d.optionE !== undefined ? { optionE: d.optionE || null } : {}),
    ...(d.correctAnswer !== undefined ? { correctAnswer: d.correctAnswer } : {}),
    ...(d.explanation !== undefined ? { explanation: d.explanation || null } : {}),
    ...(d.tip !== undefined ? { tip: d.tip || null } : {}),
    ...(d.difficulty !== undefined ? { difficulty: d.difficulty } : {}),
    ...(d.order !== undefined ? { order: d.order } : {}),
  };

  // La bonne réponse doit désigner une option non vide après modification.
  const merged = { ...existing, ...data };
  const correctOption = merged[`option${merged.correctAnswer}` as "optionA" | "optionB" | "optionC" | "optionD" | "optionE"];
  if (!correctOption) {
    return NextResponse.json({ error: `L'option ${merged.correctAnswer} (bonne réponse) est vide` }, { status: 400 });
  }

  await prisma.question.update({ where: { id: params.id }, data });
  revalidatePath(`/admin/quizzes/${existing.quizId}`);
  revalidatePath(`/quiz/${existing.quizId}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  await prisma.question.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
