// src/app/api/devices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { MAX_DEVICES } from "@/lib/device";

export const dynamic = "force-dynamic";

// يتأكد أن الطلب من تلميذ مسجّل وأن جلسة جهازه ما زالت موجودة في BDD
async function getCurrentSession(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id as string | undefined;
  const sessionToken = token?.sessionToken as string | undefined;
  if (!userId || !sessionToken) return null;

  const current = await prisma.session.findUnique({
    where: { sessionToken },
    select: { id: true, userId: true },
  });
  if (!current || current.userId !== userId) return null;

  return { userId, currentId: current.id, sessionToken };
}

// قائمة أجهزة التلميذ
export async function GET(req: NextRequest) {
  const ctx = await getCurrentSession(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, deviceInfo: true, createdAt: true },
  });

  return NextResponse.json({
    max: MAX_DEVICES,
    devices: sessions.map((s) => ({
      id: s.id,
      label: s.deviceInfo ?? "Appareil inconnu",
      createdAt: s.createdAt.toISOString(),
      isCurrent: s.id === ctx.currentId,
    })),
  });
}

// إخراج جهاز آخر (لا يمكن إخراج الجهاز الحالي من هنا)
export async function DELETE(req: NextRequest) {
  const ctx = await getCurrentSession(req);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (id === ctx.currentId) {
    return NextResponse.json(
      { error: "Impossible de déconnecter l'appareil actuel ici." },
      { status: 400 }
    );
  }

  // الشرط userId يمنع التلميذ من حذف جلسات غيره
  const { count } = await prisma.session.deleteMany({
    where: { id, userId: ctx.userId },
  });

  return NextResponse.json({ ok: count > 0 });
}
