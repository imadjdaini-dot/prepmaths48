import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { courseSchema, LEVEL_TRACK_ERROR } from "@/lib/validations";
import { isTrackForLevel, kindForLevel } from "@/types";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => ({}));

  // Bascule rapide de publication
  if (typeof body.togglePublish === "boolean") {
    await prisma.course.update({
      where: { id: params.id },
      data: { isPublished: body.togglePublish },
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = courseSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const d = parsed.data;

  // Cohérence niveau/branche : on compare avec l'état actuel si un seul des
  // deux champs est fourni.
  if (d.level !== undefined || d.track !== undefined) {
    const current = await prisma.course.findUnique({
      where: { id: params.id },
      select: { level: true, track: true },
    });
    if (!current) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    const level = d.level !== undefined ? d.level : current.level;
    const track = d.track !== undefined ? d.track : current.track;
    if (!isTrackForLevel(level, track)) {
      return NextResponse.json({ error: LEVEL_TRACK_ERROR.message }, { status: 400 });
    }
  }

  await prisma.course.update({
    where: { id: params.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.shortDescription !== undefined ? { shortDescription: d.shortDescription || null } : {}),
      ...(d.thumbnailUrl !== undefined ? { thumbnailUrl: d.thumbnailUrl || null } : {}),
      ...(d.level !== undefined ? { level: d.level ?? null, kind: kindForLevel(d.level) } : {}),
      ...(d.track !== undefined ? { track: d.track ?? null } : {}),
      ...(d.isPremium !== undefined ? { isPremium: d.isPremium } : {}),
      ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
      ...(d.order !== undefined ? { order: d.order } : {}),
    },
  });
  revalidatePath("/admin/courses", "layout");
  revalidatePath("/admin/chapters");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
