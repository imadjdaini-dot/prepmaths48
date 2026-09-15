import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";

const schema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"]),
});

/**
 * Validation manuelle d'un abonnement par l'admin.
 * ACTIVE => fixe les dates et marque le paiement lié comme PAID.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalide" }, { status: 400 });

  const sub = await prisma.subscription.findUnique({ where: { id: params.id } });
  if (!sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { status } = parsed.data;
  const months = getPlan(sub.plan)?.months || 1;

  await prisma.subscription.update({
    where: { id: params.id },
    data: {
      status,
      ...(status === "ACTIVE"
        ? {
            startDate: new Date(),
            endDate: new Date(Date.now() + months * 30 * 24 * 3600 * 1000),
          }
        : {}),
    },
  });

  // Met à jour le paiement manuel correspondant
  if (status === "ACTIVE") {
    await prisma.payment.updateMany({
      where: { userId: sub.userId, plan: sub.plan, status: "PENDING" },
      data: { status: "PAID" },
    });
  } else if (status === "REJECTED") {
    await prisma.payment.updateMany({
      where: { userId: sub.userId, plan: sub.plan, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}
