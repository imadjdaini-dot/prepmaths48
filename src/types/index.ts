import type { Role, Level, Track, CourseKind } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Constantes d'affichage pour les enums Prisma. */
export const LEVELS = ["TRONC_COMMUN", "BAC_1", "BAC_2", "CONCOURS"] as const;
export const TRACKS = ["SM", "S_EX", "MEDECINE", "ENSA"] as const;

export const LEVEL_LABELS: Record<Level, string> = {
  TRONC_COMMUN: "Tronc commun",
  BAC_1: "1ère année bac",
  BAC_2: "2ème année bac",
  CONCOURS: "Concours",
};

export const TRACK_LABELS: Record<Track, string> = {
  SM: "Sciences Maths (SM)",
  S_EX: "Sciences Expérimentales (S.Ex)",
  MEDECINE: "Médecine",
  ENSA: "ENSA",
};

/** Branches disponibles pour chaque niveau (Tronc commun : aucune). */
export const TRACKS_BY_LEVEL: Record<Level, Track[]> = {
  TRONC_COMMUN: [],
  BAC_1: ["SM", "S_EX"],
  BAC_2: ["SM", "S_EX"],
  CONCOURS: ["MEDECINE", "ENSA"],
};

export function isLevel(v: unknown): v is Level {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}
export function isTrack(v: unknown): v is Track {
  return typeof v === "string" && (TRACKS as readonly string[]).includes(v);
}

/** Une branche n'a de sens que pour son niveau (ex. MEDECINE ⇒ CONCOURS). */
export function isTrackForLevel(level: string | null | undefined, track: string | null | undefined) {
  if (!track) return true;
  if (!isLevel(level) || !isTrack(track)) return false;
  return TRACKS_BY_LEVEL[level].includes(track);
}

/** Le type de cours découle du niveau : Concours ⇔ CONCOURS, sinon COURS. */
export function kindForLevel(level: Level | null | undefined): CourseKind {
  return level === "CONCOURS" ? "CONCOURS" : "COURS";
}

/** « 2ème année bac · Sciences Maths (SM) », « Concours · Toutes branches »… */
export function formatLevelTrack(level: Level | null | undefined, track: Track | null | undefined) {
  const parts: string[] = [];
  if (level) parts.push(LEVEL_LABELS[level]);
  if (track) parts.push(TRACK_LABELS[track]);
  else if (level && TRACKS_BY_LEVEL[level].length > 0) parts.push("Toutes branches");
  return parts.join(" · ");
}

export const KIND_LABELS: Record<string, string> = {
  COURS: "Cours",
  CONCOURS: "Concours",
};

export const PLAN_LABELS: Record<string, string> = {
  GRATUIT: "Gratuit",
  COURS: "Cours",
  CONCOURS: "Concours",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  FACILE: "Facile",
  MOYEN: "Moyen",
  DIFFICILE: "Difficile",
};
