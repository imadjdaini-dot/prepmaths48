import type { Metadata } from "next";
import { Landmark, ShieldCheck } from "lucide-react";
import { PlanCard } from "@/components/pricing/plan-card";
import { Accordion } from "@/components/ui/accordion";
import { PLANS } from "@/lib/plans";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Tarifs — Prép-Maths48" };

export default async function PricingPage() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user);

  return (
    <div className="wrap py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow justify-center">Tarifs</span>
        <h1 className="mt-3 font-display text-[clamp(30px,4vw,46px)] font-semibold">
          Investis dans ta réussite.
        </h1>
        <p className="mt-3 text-[18px] text-muted">
          Des offres claires, sans surprise. Commence gratuitement et passe au premium
          quand tu te sens prêt.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} isAuthenticated={isAuthenticated} />
        ))}
      </div>

      {/* Paiement manuel marocain */}
      <div className="mt-12 grid gap-5 rounded-lg border border-line bg-surface p-7 shadow-sm md:grid-cols-2">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent-2">
            <Landmark className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-[18px] font-semibold">Paiement manuel</h3>
            <p className="mt-1.5 text-[15px] text-muted">
              Choisis un plan, effectue le virement / transfert (CIH, Attijari, Wafacash…)
              puis envoie ta preuve. Ton accès premium est activé après validation par
              notre équipe — généralement sous 24 h.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-navy text-accent">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-[18px] font-semibold">Paiement par carte</h3>
            <p className="mt-1.5 text-[15px] text-muted">
              L&apos;intégration Stripe / paiement en ligne arrive bientôt. L&apos;architecture
              est déjà prête côté plateforme.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ tarifs */}
      <div className="mx-auto mt-14 max-w-2xl">
        <h2 className="text-center font-display text-[26px] font-semibold">
          Questions sur les tarifs
        </h2>
        <div className="mt-6">
          <Accordion
            items={[
              {
                q: "Que comprend l'offre Gratuit ?",
                a: "La première vidéo de chaque leçon du programme 2ème année bac, plus quelques fiches PDF et quiz, sans limite de temps.",
              },
              {
                q: "Quelle différence entre Cours et Concours ?",
                a: "« Cours » donne accès à tout le programme 2ème année bac. « Concours » est une prépa dédiée, organisée par leçons de maths : fonctions, limites, suites, sommes, arctan.",
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui. L'offre Cours est sans engagement : il suffit de ne pas renouveler.",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
