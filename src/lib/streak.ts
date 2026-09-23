const DAY_MS = 24 * 60 * 60 * 1000;

/** Clé de jour UTC au format YYYY-MM-DD (l'heure est ignorée). */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Nombre de jours d'activité consécutifs (UTC), en remontant depuis l'activité
 * la plus récente. La série ne compte que si cette activité date d'aujourd'hui
 * ou d'hier ; au-delà, elle est rompue et vaut 0.
 */
export function computeStreak(activityDates: Date[]): number {
  const days = new Set(activityDates.map(dayKey));
  if (days.size === 0) return 0;

  const today = Date.parse(dayKey(new Date()));
  let cursor = today;
  if (!days.has(dayKey(new Date(cursor)))) {
    cursor -= DAY_MS;
    if (!days.has(dayKey(new Date(cursor)))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(new Date(cursor)))) {
    streak++;
    cursor -= DAY_MS;
  }
  return streak;
}
