import type { Chapter, Lesson } from "@prisma/client";
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
