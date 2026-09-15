import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (typeof body.togglePublish === "boolean") {
    await prisma.resource.update({ where: { id: params.id }, data: { isPublished: body.togglePublish } });
    return NextResponse.json({ ok: true });
  }
  if (typeof body.toggleDownload === "boolean") {
    await prisma.resource.update({ where: { id: params.id }, data: { allowDownload: body.toggleDownload } });
    return NextResponse.json({ ok: true });
  }

  const parsed = resourceSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 });
  const d = parsed.data;
  await prisma.resource.update({
    where: { id: params.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.fileUrl !== undefined ? { fileUrl: d.fileUrl } : {}),
      ...(d.fileType !== undefined ? { fileType: d.fileType } : {}),
      ...(d.lessonId !== undefined ? { lessonId: d.lessonId || null } : {}),
      ...(d.courseId !== undefined ? { courseId: d.courseId || null } : {}),
      ...(d.allowDownload !== undefined ? { allowDownload: d.allowDownload } : {}),
      ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  await prisma.resource.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
