import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentSubscription } from "@/lib/subscription";
import { ProfileForm } from "./profile-form";
import { PLAN_LABELS } from "@/types";
import { ButtonLink } from "@/components/ui/button";
import { Crown } from "lucide-react";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const [user, sub] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    getCurrentSubscription(sessionUser.id),
  ]);

  const isPremium = sub?.status === "ACTIVE" && sub.plan !== "GRATUIT";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Mon profil</h1>
        <p className="mt-1 text-[15px] text-muted">
          Mets à jour tes informations pour personnaliser ton parcours.
        </p>
      </div>

      {/* Carte abonnement */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-accent-soft text-accent-2">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[15px] font-semibold">
              {sub ? PLAN_LABELS[sub.plan] : "Plan gratuit"}
            </p>
            <p className="mono text-[12px] text-muted">
              Statut : {sub?.status ?? "—"}
            </p>
          </div>
        </div>
        {!isPremium && (
          <ButtonLink href="/pricing" size="sm">
            Passer au premium
          </ButtonLink>
        )}
      </div>

      <ProfileForm
        initial={{
          name: user.name,
          email: user.email,
          level: user.level,
          track: user.track,
          city: user.city,
          school: user.school,
        }}
      />
    </div>
  );
}
