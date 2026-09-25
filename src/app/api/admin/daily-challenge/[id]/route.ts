import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;
  // Les tentatives (et donc les points) de ce défi sont supprimées en cascade.
  await prisma.dailyChallenge.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
