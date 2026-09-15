import { prisma } from "@/lib/prisma";
import type { CourseKind, SubscriptionPlan } from "@prisma/client";

/** Le plan d'abonnement qui débloque un type de cours donné. */
export const PLAN_FOR_KIND: Record<CourseKind, SubscriptionPlan> = {
  COURS: "COURS",
  CONCOURS: "CONCOURS",
};

/** Liste des plans payants actifs d'un utilisateur (COURS, CONCOURS…). */
export async function getActivePlans(userId: string): Promise<SubscriptionPlan[]> {
  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      plan: { not: "GRATUIT" },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    select: { plan: true },
  });
  return Array.from(new Set(subs.map((s) => s.plan)));
}

/**
 * Détermine si un utilisateur possède au moins un abonnement payant ACTIF.
 * Vérifié uniquement côté serveur — ne jamais se fier au frontend.
 */
export async function hasActivePremium(userId: string): Promise<boolean> {
  const plans = await getActivePlans(userId);
  return plans.length > 0;
}

/** L'utilisateur a-t-il le plan qui débloque ce type de cours ? */
export async function hasPlanForKind(
  userId: string,
  kind: CourseKind
): Promise<boolean> {
  const plans = await getActivePlans(userId);
  return plans.includes(PLAN_FOR_KIND[kind]);
}

/** Récupère l'abonnement courant (le plus récent) d'un utilisateur. */
export async function getCurrentSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
