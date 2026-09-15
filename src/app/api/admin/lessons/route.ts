import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { lessonSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = lessonSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;
  const lesson = await prisma.lesson.create({
    data: {
      chapterId: d.chapterId,
      title: d.title,
      description: d.description || null,
      videoUrl: d.videoUrl || null,
      videoProvider: d.videoProvider,
      duration: d.duration,
      order: d.order,
      isFreePreview: d.isFreePreview,
      isPublished: d.isPublished,
    },
  });
  return NextResponse.json({ ok: true, id: lesson.id });
}
