import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscriptionRequestSchema } from "@/lib/validations";
import { getPlan } from "@/lib/plans";

/**
 * Demande d'abonnement (paiement manuel marocain).
 * Crée un abonnement PENDING + un paiement PENDING ; l'admin valide ensuite.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = subscriptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { plan, proofUrl } = parsed.data;
  const def = getPlan(plan);
  if (!def) return NextResponse.json({ error: "Plan introuvable" }, { status: 400 });

  if (plan === "GRATUIT") {
    return NextResponse.json({ error: "Le plan gratuit ne nécessite pas de paiement." }, { status: 400 });
  }

  await prisma.subscription.create({
    data: {
      userId: session.user.id,
      plan,
      status: "PENDING",
      paymentProvider: "manual",
      proofUrl: proofUrl ?? null,
    },
  });

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount: def.price * 100,
      currency: "MAD",
      status: "PENDING",
      provider: "manual",
      plan,
    },
  });

  return NextResponse.json({ ok: true });
}
