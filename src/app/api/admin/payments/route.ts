import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { recordPaymentSchema } from "@/lib/validations";
import { dayEnd, dayNoon } from "@/lib/school-year";

/**
 * Enregistrement d'un paiement manuel (virement, espèces…) par l'admin :
 * crée un Payment PAID et active (ou prolonge) l'abonnement de l'élève
 * pour l'offre choisie, le tout dans une transaction. Une offre Concours
 * active aussi `concoursAccess` sur le compte de l'élève.
 */
export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = recordPaymentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }
  const { userId, plan, amount, note } = parsed.data;
  const paidAt = dayNoon(parsed.data.paidAt);
  const endDate = dayEnd(parsed.data.endDate);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new Error("NOT_FOUND");

      const payment = await tx.payment.create({
        data: {
          userId,
          plan,
          amount: Math.round(amount * 100), // centimes
          currency: "MAD",
          status: "PAID",
          provider: "manual",
          providerRef: note?.trim() || null,
          createdAt: paidAt,
        },
      });

      // Abonnement à réutiliser : l'actif en priorité, sinon la demande en attente,
      // sinon le plus récent pour cette offre.
      const subs = await tx.subscription.findMany({
        where: { userId, plan },
        orderBy: { createdAt: "desc" },
      });
      const current =
        subs.find((s) => s.status === "ACTIVE") ?? subs.find((s) => s.status === "PENDING") ?? subs[0];

      const subscription = current
        ? await tx.subscription.update({
            where: { id: current.id },
            data: {
              status: "ACTIVE",
              endDate,
              paymentProvider: "manual",
              // On garde la date de début d'un abonnement déjà actif.
              startDate: current.status === "ACTIVE" && current.startDate ? current.startDate : paidAt,
            },
          })
        : await tx.subscription.create({
            data: { userId, plan, status: "ACTIVE", paymentProvider: "manual", startDate: paidAt, endDate },
          });

      // Les cours Concours ne sont visibles qu'avec concoursAccess (voir content-access.ts).
      if (plan === "CONCOURS") {
        await tx.user.update({ where: { id: userId }, data: { concoursAccess: true } });
      }

      return { paymentId: payment.id, subscriptionId: subscription.id };
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/students");
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    console.error("Erreur enregistrement paiement:", e);
    return NextResponse.json({ error: "Impossible d'enregistrer le paiement" }, { status: 500 });
  }
}
