import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { courseSchema, LEVEL_TRACK_ERROR } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { isTrackForLevel, kindForLevel } from "@/types";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = courseSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  if (!isTrackForLevel(d.level, d.track)) {
    return NextResponse.json({ error: LEVEL_TRACK_ERROR.message }, { status: 400 });
  }

  // Slug unique
  let slug = slugify(d.title);
  let i = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${slugify(d.title)}-${i++}`;
  }

  const course = await prisma.course.create({
    data: {
      title: d.title,
      slug,
      description: d.description,
      shortDescription: d.shortDescription || null,
      thumbnailUrl: d.thumbnailUrl || null,
      level: d.level ?? null,
      track: d.track ?? null,
      kind: kindForLevel(d.level),
      isPremium: d.isPremium,
      isPublished: d.isPublished,
      order: d.order,
    },
  });

  return NextResponse.json({ ok: true, id: course.id, slug: course.slug });
}
