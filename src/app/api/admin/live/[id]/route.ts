import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => ({}));
  if (typeof body.togglePublish !== "boolean") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  await prisma.liveSession.update({
    where: { id: params.id },
    data: { isPublished: body.togglePublish },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  await prisma.liveSession.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
