// Dates « jour » (YYYY-MM-DD) des formulaires admin, ancrées sur l'heure du Maroc
// (UTC+1) pour que la date affichée soit la même côté serveur (UTC) et navigateur.
const MA_OFFSET = "+01:00";

/** Fin de l'année scolaire en cours : 30 juin (celui de l'année suivante à partir de juillet). */
export function schoolYearEnd(now = new Date()): string {
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-06-30`;
}

/** Aujourd'hui au format YYYY-MM-DD (heure locale du navigateur). */
export function todayDay(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** "2027-06-30" -> 30/06/2027 23:59:59 heure du Maroc (l'accès couvre toute la journée). */
export function dayEnd(day: string): Date {
  return new Date(`${day}T23:59:59${MA_OFFSET}`);
}

/** "2026-09-23" -> midi heure du Maroc (évite tout décalage de jour à l'affichage). */
export function dayNoon(day: string): Date {
  return new Date(`${day}T12:00:00${MA_OFFSET}`);
}

/** Date -> "YYYY-MM-DD" (jour marocain), pour préremplir un <input type="date">. */
export function toDay(date: Date): string {
  return new Date(date.getTime() + 3600 * 1000).toISOString().slice(0, 10);
}

/** Date -> "30/06/2027" (jour marocain). */
export function formatDay(date: Date): string {
  const [y, m, d] = toDay(date).split("-");
  return `${d}/${m}/${y}`;
}
