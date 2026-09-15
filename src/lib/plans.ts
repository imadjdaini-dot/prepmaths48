import type { SubscriptionPlan } from "@prisma/client";

export type PlanDef = {
  id: SubscriptionPlan;
  name: string;
  price: number; // MAD / période, 0 = gratuit
  period: string;
  months: number; // durée d'accès accordée à l'activation (0 = illimité / gratuit)
  tagline: string;
  features: string[];
  highlight?: boolean;
  cta: string;
};

// ⚠️ Prix provisoires — à ajuster.
export const PLANS: PlanDef[] = [
  {
    id: "GRATUIT",
    name: "Gratuit",
    price: 0,
    period: "pour toujours",
    months: 0,
    tagline: "Découvre la méthode 48.",
    features: [
      "1ère vidéo de chaque cours du lycée (Tronc commun, 1ère et 2ème bac)",
      "Quelques fiches PDF",
      "Quiz limités",
      "Suivi de progression de base",
    ],
    cta: "Accéder gratuitement",
  },
  {
    id: "COURS",
    name: "Cours",
    price: 199,
    period: "/ mois",
    months: 1,
    tagline: "Tout le programme du lycée, SM et S.Ex.",
    features: [
      "Tous les cours Tronc commun, 1ère et 2ème bac (SM / S.Ex)",
      "Toutes les vidéos et fiches PDF",
      "Tous les quiz corrigés",
      "Statistiques détaillées et reprise auto",
    ],
    highlight: true,
    cta: "Choisir Cours",
  },
  {
    id: "CONCOURS",
    name: "Concours",
    price: 499,
    period: "/ accès",
    months: 6,
    tagline: "Préparation Médecine & ENSA par leçons de maths.",
    features: [
      "Leçons : fonctions, limites, suites, sommes, arctan",
      "Concours Médecine et ENSA",
      "Méthodes, exercices types et annales",
      "Mode examen et quiz chronométrés",
      "Accès 6 mois",
    ],
    cta: "Choisir Concours",
  },
];

export function getPlan(id: SubscriptionPlan): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}
