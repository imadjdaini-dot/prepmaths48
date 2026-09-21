import { redirect } from "next/navigation";
import type { CourseKind } from "@prisma/client";
import { auth } from "@/lib/auth";
import { hasPlanForKind } from "@/lib/subscription";
import { CONCOURS_BUNDLED_WITH_COURS, getAudience } from "@/lib/content-access";
import type { SessionUser } from "@/types";

/** Exige un utilisateur connecté, sinon redirige vers /login. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }
  
  return session.user as SessionUser;
}

/** Exige un administrateur, sinon redirige. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/**
 * Abonnement requis pour un type de cours. Cette année, les concours sont inclus
 * dans le plan COURS pour les comptes ayant « concoursAccess » (voir content-access.ts).
 */
async function hasEntitlement(userId: string, kind: CourseKind): Promise<boolean> {
  if (await hasPlanForKind(userId, kind)) return true;

  if (kind === "CONCOURS" && CONCOURS_BUNDLED_WITH_COURS) {
    const audience = await getAudience(userId);
    if (audience?.concoursAccess) return hasPlanForKind(userId, "COURS");
  }
  return false;
}

/**
 * Détermine si un utilisateur peut accéder au contenu d'une leçon.
 */
export async function canAccessLesson(
  user: SessionUser | null,
  opts: { isFreePreview: boolean; courseIsPremium: boolean; courseKind: CourseKind }
): Promise<boolean> {
  const free = opts.isFreePreview || !opts.courseIsPremium;
  if (free) return true;
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return hasEntitlement(user.id, opts.courseKind);
}

/** Accès au contenu premium d'un cours. */
export async function canAccessPremiumCourse(
  user: SessionUser | null,
  courseKind: CourseKind
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return hasEntitlement(user.id, courseKind);
}