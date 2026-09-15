import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { quizSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = quizSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;
  const quiz = await prisma.quiz.create({
    data: {
      title: d.title,
      description: d.description || null,
      lessonId: d.lessonId || null,
      courseId: d.courseId || null,
      isPublished: d.isPublished,
    },
  });
  return NextResponse.json({ ok: true, id: quiz.id });
}
