import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { lessonSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (typeof body.togglePublish === "boolean") {
    await prisma.lesson.update({ where: { id: params.id }, data: { isPublished: body.togglePublish } });
    return NextResponse.json({ ok: true });
  }

  const parsed = lessonSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 });
  const d = parsed.data;
  await prisma.lesson.update({
    where: { id: params.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description || null } : {}),
      ...(d.videoUrl !== undefined ? { videoUrl: d.videoUrl || null } : {}),
      ...(d.videoProvider !== undefined ? { videoProvider: d.videoProvider } : {}),
      ...(d.duration !== undefined ? { duration: d.duration } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
      ...(d.isFreePreview !== undefined ? { isFreePreview: d.isFreePreview } : {}),
      ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  await prisma.lesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
