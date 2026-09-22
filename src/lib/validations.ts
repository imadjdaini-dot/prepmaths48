import { z } from "zod";
import { LEVELS, TRACKS, isTrackForLevel } from "@/types";

const PROVIDERS = ["LOCAL", "BUNNY", "CLOUDFLARE", "VIMEO", "YOUTUBE"] as const;
const RES_TYPES = ["PDF", "DOC", "IMAGE", "OTHER"] as const;
const DIFFICULTIES = ["FACILE", "MOYEN", "DIFFICILE"] as const;
const PLANS = ["GRATUIT", "COURS", "CONCOURS"] as const;

/**
 * Les <select> HTML envoient parfois "" ou la CHAÎNE "null" pour « aucune valeur »
 * (ex. Tronc commun + « Aucune branche »). On les convertit en vrai null.
 * On laisse `undefined` intact pour ne pas écraser un champ absent d'un PATCH.
 */
const emptyToNull = (v: unknown) => (v === "" || v === "null" ? null : v);

/** Niveau + branche optionnels, mais la branche doit appartenir au niveau. */
const levelTrackFields = {
  level: z.preprocess(emptyToNull, z.enum(LEVELS).nullable()).optional(),
  track: z.preprocess(emptyToNull, z.enum(TRACKS).nullable()).optional(),
};
const levelTrackCoherent = (d: { level?: string | null; track?: string | null }) =>
  isTrackForLevel(d.level, d.track);
export const LEVEL_TRACK_ERROR = { message: "Branche incompatible avec le niveau", path: ["track"] };

/** Création d'un compte élève — réservée à l'administrateur. */
export const createStudentSchema = z
  .object({
    name: z.string().min(2, "Nom trop court").max(80),
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    // Accès au contenu des concours (défini par l'admin, voir content-access.ts)
    concoursAccess: z.boolean().optional(),
    ...levelTrackFields,
  })
  .refine(levelTrackCoherent, LEVEL_TRACK_ERROR);
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

/** Profil modifiable par l'élève — niveau/branche sont réservés à l'admin. */
export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  city: z.string().max(80).optional().nullable(),
  school: z.string().max(120).optional().nullable(),
});

/** Mise à jour d'un élève par l'admin. */
export const updateStudentSchema = z
  .object({
    role: z.enum(["STUDENT", "ADMIN"]).optional(),
    isActive: z.boolean().optional(),
    grantPremium: z.boolean().optional(),
    concoursAccess: z.boolean().optional(),
    ...levelTrackFields,
  })
  .refine(levelTrackCoherent, LEVEL_TRACK_ERROR);

export const courseSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10),
  shortDescription: z.string().max(220).optional().nullable(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")).nullable(),
  // `kind` n'est pas saisi : il est dérivé du niveau côté serveur (kindForLevel).
  // Pas de .refine ici pour garder .partial() dans le PATCH : la cohérence
  // niveau/branche est vérifiée dans les route handlers (isTrackForLevel).
  ...levelTrackFields,
  isPremium: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
});

export const chapterSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2).max(140),
  description: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

export const lessonSchema = z.object({
  chapterId: z.string().min(1),
  title: z.string().min(2).max(160),
  description: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  videoProvider: z.enum(PROVIDERS).default("LOCAL"),
  duration: z.coerce.number().int().min(0).default(0),
  order: z.coerce.number().int().min(0).default(0),
  isFreePreview: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const resourceSchema = z.object({
  title: z.string().min(2).max(160),
  fileUrl: z.string().min(1),
  fileType: z.enum(RES_TYPES).default("PDF"),
  lessonId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  allowDownload: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const quizSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const questionSchema = z.object({
  quizId: z.string().min(1),
  statement: z.string().min(3),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().optional().nullable(),
  optionD: z.string().optional().nullable(),
  optionE: z.string().optional().nullable(),
  correctAnswer: z.enum(["A", "B", "C", "D", "E"]),
  explanation: z.string().optional().nullable(),
  tip: z.string().optional().nullable(),
  difficulty: z.enum(DIFFICULTIES).default("MOYEN"),
  order: z.coerce.number().int().min(0).default(0),
});

export const quizSubmissionSchema = z.object({
  quizId: z.string().min(1),
  duration: z.coerce.number().int().min(0).default(0),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.string().nullable(),
    })
  ),
});

export const liveSessionSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().optional().nullable(),
  meetUrl: z.string().url("Lien Meet invalide"),
  ...levelTrackFields,
  startAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(1).max(600).default(60),
  isPublished: z.boolean().default(false),
});

export const subscriptionRequestSchema = z.object({
  plan: z.enum(PLANS),
  proofUrl: z.string().optional().nullable(),
});
