import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { updateStudentSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = updateStudentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalide" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Niveau/branche : seul l'admin les modifie (l'élève les voit en lecture seule).
  // Les deux sont envoyés ensemble par le formulaire pour garantir la cohérence.
  if (d.role !== undefined || d.isActive !== undefined || d.level !== undefined) {
    await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(d.role !== undefined ? { role: d.role } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        ...(d.level !== undefined ? { level: d.level, track: d.track ?? null } : {}),
      },
    });
  }

  // Activation / révocation manuelle du premium.
  // « Accorder » = accès complet : Cours (2è bac) + Concours.
  if (d.grantPremium === true) {
    const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000);
    await prisma.subscription.createMany({
      data: (["COURS", "CONCOURS"] as const).map((plan) => ({
        userId: params.id,
        plan,
        status: "ACTIVE" as const,
        paymentProvider: "manual",
        startDate: new Date(),
        endDate: oneYear,
      })),
    });
  } else if (d.grantPremium === false) {
    await prisma.subscription.updateMany({
      where: { userId: params.id, status: "ACTIVE" },
      data: { status: "CANCELLED", endDate: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
