import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = resourceSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }
  const d = parsed.data;
  const resource = await prisma.resource.create({
    data: {
      title: d.title,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      lessonId: d.lessonId || null,
      courseId: d.courseId || null,
      allowDownload: d.allowDownload,
      isPublished: d.isPublished,
    },
  });
  return NextResponse.json({ ok: true, id: resource.id });
}
