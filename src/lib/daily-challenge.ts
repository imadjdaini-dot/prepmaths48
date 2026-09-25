// Défi du jour : sélection du défi d'un élève, barème des points, badges de régularité.
import type { Level, Prisma, Track } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dayNoon, toDay } from "@/lib/school-year";
import { computeStreak } from "@/lib/streak";

/** Points fixes pour un défi terminé + bonus proportionnel au score (0-100). */
export const DAILY_BASE_POINTS = 10;
export const DAILY_SCORE_BONUS = 10;

export function challengePoints(score: number): number {
  return DAILY_BASE_POINTS + Math.round((score / 100) * DAILY_SCORE_BONUS);
}

/** Date stockée pour le défi d'aujourd'hui (midi, heure du Maroc). */
export function todayChallengeDate(now = new Date()): Date {
  return dayNoon(toDay(now));
}

/**
 * Défi du jour pour un élève. Plusieurs défis peuvent coexister le même jour ;
 * le ciblage le plus précis l'emporte :
 *   niveau + branche exacts  >  niveau (toutes branches)  >  général (tous niveaux).
 */
export async function findTodayChallenge(audience: { level: Level | null; track: Track | null }) {
  const targets: Prisma.DailyChallengeWhereInput[] = [{ level: null, track: null }];
  if (audience.level) {
    targets.push({ level: audience.level, track: null });
    if (audience.track) targets.push({ level: audience.level, track: audience.track });
  }

  const candidates = await prisma.dailyChallenge.findMany({
    where: { date: todayChallengeDate(), OR: targets },
    include: { quiz: { select: { id: true, title: true } } },
  });
  const precision = (c: { level: Level | null; track: Track | null }) =>
    (c.level ? 1 : 0) + (c.track ? 1 : 0);
  return candidates.sort((a, b) => precision(b) - precision(a))[0] ?? null;
}

export const STREAK_BADGES = [
  { days: 30, emoji: "🏆", label: "30 jours d'affilée" },
  { days: 7, emoji: "🥈", label: "7 jours d'affilée" },
  { days: 3, emoji: "🥉", label: "3 jours d'affilée" },
] as const;

/** Meilleur badge atteint pour une série de défis, ou null. */
export function streakBadge(streak: number) {
  return STREAK_BADGES.find((b) => streak >= b.days) ?? null;
}

/**
 * Série de défis consécutifs. On utilise la date du défi (midi heure du Maroc,
 * donc le même jour en UTC) plutôt que createdAt, pour qu'un défi fait à 00h30
 * heure du Maroc compte bien pour le bon jour.
 */
export function challengeStreak(challengeDates: Date[]): number {
  return computeStreak(challengeDates);
}

/** "Imad Jdaini" -> "Imad J." : jamais le nom complet dans un classement. */
export function publicName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return last ? `${first} ${last[0].toUpperCase()}.` : first || "Élève";
}
