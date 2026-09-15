import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { chapterSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = chapterSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;
  const chapter = await prisma.chapter.create({
    data: {
      courseId: d.courseId,
      title: d.title,
      description: d.description || null,
      order: d.order,
      isPublished: d.isPublished,
    },
  });
  return NextResponse.json({ ok: true, id: chapter.id });
}
