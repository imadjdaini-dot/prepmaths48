import type { Metadata } from "next";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { PlanCard } from "@/components/pricing/plan-card";
import { Accordion } from "@/components/ui/accordion";
import { PLANS } from "@/lib/plans";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Tarifs — Prép-Maths48" };

const WHATSAPP_NUMBER = "212708970814";
const WHATSAPP_COURS_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Bonjour, je souhaite m'abonner à l'offre Cours (600 MAD)."
)}`;
const WHATSAPP_CONCOURS_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Bonjour, je souhaite m'abonner à l'offre Concours (500 MAD)."
)}`;

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
            <MessageCircle className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[18px] font-semibold">Comment s&apos;abonner ?</h3>
            <ol className="mt-3.5 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[13px] font-bold text-white">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-muted">
                    Contacte-nous sur WhatsApp au{" "}
                    <span className="font-semibold text-ink">07 08 97 08 14</span>.
                  </p>
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <a
                      href={WHATSAPP_COURS_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm w-full sm:w-auto"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp — Cours
                    </a>
                    <a
                      href={WHATSAPP_CONCOURS_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-dark btn-sm w-full sm:w-auto"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp — Concours
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[13px] font-bold text-white">
                  2
                </span>
                <p className="text-[15px] text-muted">
                  Tu recevras un numéro de compte bancaire. Effectue le paiement du montant
                  correspondant à l&apos;offre choisie.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[13px] font-bold text-white">
                  3
                </span>
                <p className="text-[15px] text-muted">
                  Envoie une capture d&apos;écran du paiement dans la même conversation
                  WhatsApp.
                </p>
              </li>
            </ol>
            <p className="mt-4 rounded-md bg-accent-soft px-4 py-3 text-[13.5px] font-medium text-accent-2">
              Après vérification du paiement, tu reçois un accès personnel, non partageable —
              valable sur 2 appareils maximum.
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
