import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { liveSessionSchema, LEVEL_TRACK_ERROR } from "@/lib/validations";
import { isTrackForLevel } from "@/types";

export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = liveSessionSchema.safeParse(await req.json().catch(() => ({})));
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

  const session = await prisma.liveSession.create({
    data: {
      title: d.title,
      description: d.description || null,
      meetUrl: d.meetUrl,
      level: d.level ?? null,
      track: d.track ?? null,
      startAt: d.startAt,
      durationMinutes: d.durationMinutes,
      isPublished: d.isPublished,
    },
  });
  return NextResponse.json({ ok: true, id: session.id });
}
