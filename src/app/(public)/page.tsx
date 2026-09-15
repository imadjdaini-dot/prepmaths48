import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  BookOpenCheck,
  BrainCircuit,
  LineChart,
  FunctionSquare,
  Infinity as InfinityIcon,
  ListOrdered,
  Sigma,
  Spline,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { CourseCard } from "@/components/courses/course-card";
import { getCourseCards } from "@/lib/queries";
import { PLANS } from "@/lib/plans";
import { formatPrice } from "@/lib/utils";

// Données dynamiques (cours en base) — pas de génération statique au build.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const courses = await getCourseCards({ take: 6 });

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(900px 420px at 78% 8%, color-mix(in srgb,var(--accent) 22%, transparent), transparent 60%), radial-gradient(700px 460px at 8% 92%, color-mix(in srgb,var(--cyan) 16%, transparent), transparent 62%)",
          }}
        />
        <div className="wrap relative py-16 md:py-24 max-w-3xl mx-auto text-center">
          <div>
            <span className="eyebrow justify-center">
              <span className="h-px w-5 bg-current" /> Bac & concours post-bac
            </span>
            <h1 className="mt-4 font-display text-[clamp(38px,5vw,60px)] font-semibold leading-[1.05] tracking-tight">
              Maîtrise les maths du Bac et{" "}
              <span className="relative whitespace-nowrap">
                réussis les concours
                <span className="absolute -left-0.5 -right-0.5 bottom-1 -z-10 h-[0.32em] rounded bg-accent/30" />
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-[19px] text-ink-2">
              Un parcours clair, étape par étape : vidéos, fiches PDF, quiz corrigés
              et suivi de progression. La méthode 48 pour les élèves marocains.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3.5">
              <ButtonLink href="/catalogue" size="lg">
                Voir les cours <ArrowRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/login" variant="ghost" size="lg">
                Se connecter
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROBLÈME ============ */}
      <section className="wrap py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">Le vrai problème</span>
          <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-semibold">
            Travailler dur ne suffit pas si la méthode manque.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              t: "Cours dispersés",
              d: "Des PDF par-ci, des vidéos par-là : impossible de savoir par où commencer.",
            },
            {
              t: "Pas de suivi",
              d: "Difficile de mesurer ses progrès et d'identifier ses points faibles.",
            },
            {
              t: "Concours flous",
              d: "Des notions clés rarement travaillées à fond : fonctions, limites, suites…",
            },
          ].map((c) => (
            <div key={c.t} className="card p-6 shadow-sm">
              <h3 className="font-display text-[18px] font-semibold">{c.t}</h3>
              <p className="mt-2 text-[15px] text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ MÉTHODE 48 ============ */}
      <section id="methode" className="border-y border-line bg-surface">
        <div className="wrap grid items-start gap-14 py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28">
            <span className="eyebrow">La méthode 48</span>
            <div className="mt-3 bg-gradient-to-br from-ink to-navy-3 bg-clip-text font-display text-[96px] font-bold leading-none tracking-tighter text-transparent">
              48<sup className="align-top text-[30px] text-accent-2">h</sup>
            </div>
            <p className="mt-4 max-w-sm text-[16px] text-muted">
              Un cycle d&apos;apprentissage en 4 étapes pour transformer chaque chapitre
              en réflexe, en moins de 48 heures de travail guidé.
            </p>
          </div>
          <div className="space-y-5">
            {[
              {
                icon: BookOpenCheck,
                t: "1 · Comprendre",
                d: "Vidéos courtes et claires qui posent les notions essentielles, sans bla-bla.",
              },
              {
                icon: BrainCircuit,
                t: "2 · S'entraîner",
                d: "Exercices types et fiches PDF pour ancrer chaque méthode.",
              },
              {
                icon: Target,
                t: "3 · Se tester",
                d: "Quiz corrigés avec explications et astuces pour repérer les pièges.",
              },
              {
                icon: LineChart,
                t: "4 · Progresser",
                d: "Statistiques et reprise automatique là où tu t'es arrêté.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.t} className="flex gap-4 rounded-md border border-line bg-surface-2 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent-2">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-[18px] font-semibold">{s.t}</h3>
                    <p className="mt-1 text-[15px] text-muted">{s.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ COURS ============ */}
      <section className="wrap py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="eyebrow">Cours disponibles</span>
            <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-semibold">
              Des cours alignés sur le programme.
            </h2>
          </div>
          <ButtonLink href="/catalogue" variant="ghost" size="sm">
            Tout le catalogue <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>

      {/* ============ CONCOURS ============ */}
      <section id="concours" className="border-y border-line bg-surface">
        <div className="wrap py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">Concours par leçons</span>
            <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-semibold">
              Une prépa concours, leçon par leçon.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { icon: FunctionSquare, t: "Fonctions", d: "Études & propriétés" },
              { icon: InfinityIcon, t: "Limites", d: "Calcul & continuité" },
              { icon: ListOrdered, t: "Suites", d: "Convergence & récurrence" },
              { icon: Sigma, t: "Sommes", d: "Sommes & séries" },
              { icon: Spline, t: "Arctan", d: "Fonctions réciproques" },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.t}
                  href="/catalogue?kind=CONCOURS"
                  className="card flex flex-col items-start gap-3 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-[12px] bg-navy text-accent">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-[18px] font-semibold">{c.t}</h3>
                    <p className="mt-0.5 text-sm text-muted">{c.d}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ PRICING RÉSUMÉ ============ */}
      <section id="pricing" className="border-y border-line bg-surface">
        <div className="wrap py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">Tarifs simples</span>
            <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-semibold">
              Commence gratuitement, passe au premium quand tu veux.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={`card flex flex-col p-6 shadow-sm ${
                  p.highlight ? "ring-2 ring-accent" : ""
                }`}
              >
                {p.highlight && (
                  <span className="badge badge-premium mb-2 w-fit">Le plus choisi</span>
                )}
                <h3 className="font-display text-[18px] font-semibold">{p.name}</h3>
                <div className="mt-2 font-display text-[30px] font-bold">
                  {p.price === 0 ? "Gratuit" : formatPrice(p.price * 100)}
                  <span className="text-[13px] font-medium text-muted"> {p.period}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-[14px] text-ink-2">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href="/pricing"
                  variant={p.highlight ? "primary" : "ghost"}
                  size="sm"
                  className="mt-5 w-full"
                >
                  {p.cta}
                </ButtonLink>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="wrap py-20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="eyebrow justify-center">Questions fréquentes</span>
            <h2 className="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-semibold">
              Tout ce que tu dois savoir.
            </h2>
          </div>
          <div className="mt-9">
            <Accordion
              items={[
                {
                  q: "Les cours suivent-ils le programme marocain ?",
                  a: "Oui. Les cours de 2ème année Bac (SM, PC, SVT) couvrent le programme officiel, et la prépa concours est organisée par leçons de maths : fonctions, limites, suites, sommes, arctan.",
                },
                {
                  q: "Puis-je essayer gratuitement ?",
                  a: "Bien sûr. L'offre Gratuit donne accès à la première vidéo de chaque leçon du programme 2ème année bac, sans limite de temps.",
                },
                {
                  q: "Comment fonctionne le paiement au Maroc ?",
                  a: "Tu peux payer manuellement (virement / transfert) puis envoyer ta preuve : l'accès premium est activé après validation. Le paiement par carte arrivera prochainement.",
                },
                {
                  q: "Les vidéos sont-elles téléchargeables ?",
                  a: "Non. Les vidéos sont diffusées via un lecteur sécurisé avec liens temporaires signés et filigrane personnalisé, pour protéger le contenu des professeurs.",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="wrap pb-24">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-navy to-navy-2 px-8 py-16 text-center text-white md:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(600px 300px at 80% 0%, color-mix(in srgb,var(--accent) 30%, transparent), transparent 60%)",
            }}
          />
          <h2 className="relative font-display text-[clamp(28px,3.6vw,42px)] font-semibold">
            Prêt à transformer les maths en point fort ?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-[17px] text-[#9fb0c9]">
            Rejoins Prép-Maths48 aujourd&apos;hui et avance avec une méthode claire. Les comptes
            élèves sont créés par l&apos;administration : demande tes identifiants à ton professeur.
          </p>
          <div className="relative mt-7 flex justify-center gap-3.5">
            <ButtonLink href="/login" variant="white" size="lg">
              Se connecter <ArrowRight className="h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              size="lg"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              Voir les tarifs
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}