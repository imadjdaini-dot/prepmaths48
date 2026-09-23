import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { chapterSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (typeof body.togglePublish === "boolean") {
    await prisma.chapter.update({ where: { id: params.id }, data: { isPublished: body.togglePublish } });
    return NextResponse.json({ ok: true });
  }

  const parsed = chapterSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;

  const existing = await prisma.chapter.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Changement de cours parent : le cours cible doit exister.
  if (d.courseId !== undefined) {
    const course = await prisma.course.findUnique({ where: { id: d.courseId }, select: { id: true } });
    if (!course) return NextResponse.json({ error: "Cours introuvable" }, { status: 400 });
  }

  await prisma.chapter.update({
    where: { id: params.id },
    data: {
      ...(d.courseId !== undefined ? { courseId: d.courseId } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
      ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
    },
  });
  revalidatePath("/admin/chapters");
  revalidatePath("/admin/lessons");
  revalidatePath("/admin/courses", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  await prisma.chapter.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
