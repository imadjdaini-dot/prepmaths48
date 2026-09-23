import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { dayEnd } from "@/lib/school-year";
import { updateSubscriptionSchema } from "@/lib/validations";

/**
 * Gestion manuelle d'un abonnement par l'admin.
 * - status ACTIVE sans endDate => fixe les dates selon la durée du plan (validation d'une demande).
 * - endDate => fixe la date de fin choisie (modification / réactivation).
 * - Si la demande était PENDING, le paiement lié passe à PAID (ACTIVE) ou FAILED (REJECTED).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = updateSubscriptionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalide" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { id: params.id } });
  if (!sub) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { status } = parsed.data;
  const endDate = parsed.data.endDate ? dayEnd(parsed.data.endDate) : undefined;
  const months = getPlan(sub.plan)?.months || 1;

  await prisma.subscription.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(endDate
        ? { endDate, ...(status === "ACTIVE" && !sub.startDate ? { startDate: new Date() } : {}) }
        : status === "ACTIVE"
          ? {
              startDate: new Date(),
              endDate: new Date(Date.now() + months * 30 * 24 * 3600 * 1000),
            }
          : {}),
    },
  });

  // Met à jour le paiement manuel correspondant à une demande en attente
  if (sub.status === "PENDING" && status === "ACTIVE") {
    await prisma.payment.updateMany({
      where: { userId: sub.userId, plan: sub.plan, status: "PENDING" },
      data: { status: "PAID" },
    });
  } else if (sub.status === "PENDING" && status === "REJECTED") {
    await prisma.payment.updateMany({
      where: { userId: sub.userId, plan: sub.plan, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/students");
  return NextResponse.json({ ok: true });
}
