import type { Chapter, Lesson, Question, Quiz } from "@prisma/client";
import { DIFFICULTY_LABELS } from "@/types";
import type { Field } from "@/components/admin/inline-create";

type Option = { value: string; label: string };

const VIDEO_PROVIDER_OPTIONS: Option[] = [
  { value: "LOCAL", label: "Local / signé" },
  { value: "BUNNY", label: "Bunny Stream" },
  { value: "CLOUDFLARE", label: "Cloudflare Stream" },
  { value: "VIMEO", label: "Vimeo privé" },
  { value: "YOUTUBE", label: "YouTube (preview)" },
];

/** Champs du formulaire chapitre (création ou édition si `chapter` est fourni). */
export function chapterFields(courses: Option[], chapter?: Partial<Chapter>): Field[] {
  return [
    {
      name: "courseId",
      label: "Cours",
      type: "select",
      required: true,
      colSpan: 2,
      options: courses,
      defaultValue: chapter?.courseId,
    },
    { name: "title", label: "Titre", required: true, colSpan: 2, defaultValue: chapter?.title },
    { name: "description", label: "Description", type: "textarea", defaultValue: chapter?.description },
    { name: "order", label: "Ordre", type: "number", defaultValue: chapter?.order ?? 0 },
    { name: "isPublished", label: "Publié", type: "checkbox", defaultValue: chapter?.isPublished ?? true },
  ];
}

/** Champs du formulaire séance (création ou édition si `lesson` est fourni). */
export function lessonFields(chapters: Option[], lesson?: Partial<Lesson>): Field[] {
  return [
    {
      name: "chapterId",
      label: "Chapitre",
      type: "select",
      required: true,
      colSpan: 2,
      options: chapters,
      defaultValue: lesson?.chapterId,
    },
    { name: "title", label: "Titre", required: true, colSpan: 2, defaultValue: lesson?.title },
    { name: "description", label: "Description", type: "textarea", defaultValue: lesson?.description },
    {
      name: "videoUrl",
      label: "URL vidéo",
      type: "url",
      colSpan: 2,
      placeholder: "https://… ou /uploads/…",
      defaultValue: lesson?.videoUrl,
    },
    {
      name: "videoProvider",
      label: "Fournisseur vidéo",
      type: "select",
      defaultValue: lesson?.videoProvider ?? "LOCAL",
      options: VIDEO_PROVIDER_OPTIONS,
    },
    { name: "duration", label: "Durée (secondes)", type: "number", defaultValue: lesson?.duration ?? 600 },
    { name: "order", label: "Ordre", type: "number", defaultValue: lesson?.order ?? 0 },
    { name: "isFreePreview", label: "Aperçu gratuit", type: "checkbox", defaultValue: lesson?.isFreePreview ?? false },
    { name: "isPublished", label: "Publié", type: "checkbox", defaultValue: lesson?.isPublished ?? true },
  ];
}

/** Champs du formulaire quiz (création ou édition si `quiz` est fourni). */
export function quizFields(courses: Option[], quiz?: Partial<Quiz>): Field[] {
  return [
    { name: "title", label: "Titre", required: true, colSpan: 2, defaultValue: quiz?.title },
    { name: "description", label: "Description", type: "textarea", defaultValue: quiz?.description },
    {
      name: "courseId",
      label: "Cours associé (optionnel)",
      type: "select",
      colSpan: 2,
      options: [{ value: "", label: "— Aucun —" }, ...courses],
      defaultValue: quiz?.courseId ?? "",
    },
    { name: "isPublished", label: "Publié", type: "checkbox", defaultValue: quiz?.isPublished ?? true },
  ];
}

/**
 * Champs du formulaire question (création ou édition si `question` est fourni).
 * `quizId` n'en fait pas partie : la création l'ajoute, l'édition ne change pas de quiz.
 */
export function questionFields(question?: Partial<Question>, defaultOrder = 0): Field[] {
  return [
    { name: "statement", label: "Énoncé", type: "textarea", required: true, defaultValue: question?.statement },
    { name: "optionA", label: "Option A", required: true, defaultValue: question?.optionA },
    { name: "optionB", label: "Option B", required: true, defaultValue: question?.optionB },
    { name: "optionC", label: "Option C", defaultValue: question?.optionC },
    { name: "optionD", label: "Option D", defaultValue: question?.optionD },
    { name: "optionE", label: "Option E", defaultValue: question?.optionE },
    {
      name: "correctAnswer",
      label: "Bonne réponse",
      type: "select",
      required: true,
      options: ["A", "B", "C", "D", "E"].map((x) => ({ value: x, label: x })),
      defaultValue: question?.correctAnswer,
    },
    {
      name: "difficulty",
      label: "Difficulté",
      type: "select",
      defaultValue: question?.difficulty ?? "MOYEN",
      options: Object.entries(DIFFICULTY_LABELS).map(([v, l]) => ({ value: v, label: l })),
    },
    { name: "explanation", label: "Explication", type: "textarea", defaultValue: question?.explanation },
    { name: "tip", label: "Astuce", colSpan: 2, defaultValue: question?.tip },
    { name: "order", label: "Ordre", type: "number", defaultValue: question?.order ?? defaultOrder },
  ];
}
