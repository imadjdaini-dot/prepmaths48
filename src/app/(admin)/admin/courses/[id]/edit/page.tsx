import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, PlayCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";
import { InlineCreate } from "@/components/admin/inline-create";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { formatDuration } from "@/lib/utils";

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      chapters: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Retour aux cours
      </Link>
      <h1 className="font-display text-[28px] font-semibold">Modifier le cours</h1>

      <CourseForm
        initial={{
          id: course.id,
          title: course.title,
          description: course.description,
          shortDescription: course.shortDescription ?? "",
          thumbnailUrl: course.thumbnailUrl ?? "",
          level: course.level ?? "",
          track: course.track ?? "",
          isPremium: course.isPremium,
          isPublished: course.isPublished,
          order: course.order,
        }}
      />

      {/* Contenu : chapitres & séances */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[20px] font-semibold">Contenu du cours</h2>
          <InlineCreate
            title="Nouveau chapitre"
            buttonLabel="Chapitre"
            endpoint="/api/admin/chapters"
            fields={[
              { name: "courseId", label: "courseId", type: "text", defaultValue: course.id, colSpan: 2 },
              { name: "title", label: "Titre du chapitre", required: true, colSpan: 2 },
              { name: "order", label: "Ordre", type: "number", defaultValue: course.chapters.length },
              { name: "isPublished", label: "Publié", type: "checkbox", defaultValue: true },
            ]}
          />
        </div>

        {course.chapters.length === 0 && (
          <p className="text-sm text-muted">Aucun chapitre. Ajoute-en un pour commencer.</p>
        )}

        {course.chapters.map((ch) => (
          <div key={ch.id} className="card overflow-hidden shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-line-2 bg-surface-2 px-5 py-3">
              <h3 className="font-display text-[16px] font-semibold">{ch.title}</h3>
              <PublishToggle endpoint={`/api/admin/chapters/${ch.id}`} initial={ch.isPublished} />
              <div className="ml-auto flex items-center gap-2">
                <InlineCreate
                  title={`Nouvelle séance — ${ch.title}`}
                  buttonLabel="Séance"
                  endpoint="/api/admin/lessons"
                  fields={[
                    { name: "chapterId", label: "chapterId", type: "text", defaultValue: ch.id, colSpan: 2 },
                    { name: "title", label: "Titre", required: true, colSpan: 2 },
                    { name: "description", label: "Description", type: "textarea" },
                    { name: "videoUrl", label: "URL vidéo", type: "url", colSpan: 2, placeholder: "https://… ou /uploads/…" },
                    {
                      name: "videoProvider",
                      label: "Fournisseur vidéo",
                      type: "select",
                      defaultValue: "LOCAL",
                      options: [
                        { value: "LOCAL", label: "Local / signé" },
                        { value: "BUNNY", label: "Bunny Stream" },
                        { value: "CLOUDFLARE", label: "Cloudflare Stream" },
                        { value: "VIMEO", label: "Vimeo privé" },
                        { value: "YOUTUBE", label: "YouTube (preview)" },
                      ],
                    },
                    { name: "duration", label: "Durée (secondes)", type: "number", defaultValue: 600 },
                    { name: "order", label: "Ordre", type: "number", defaultValue: ch.lessons.length },
                    { name: "isFreePreview", label: "Aperçu gratuit", type: "checkbox" },
                    { name: "isPublished", label: "Publié", type: "checkbox", defaultValue: true },
                  ]}
                />
                <ConfirmDelete endpoint={`/api/admin/chapters/${ch.id}`} iconOnly confirmText={`Supprimer le chapitre « ${ch.title} » ?`} />
              </div>
            </div>
            <ul className="divide-y divide-line-2">
              {ch.lessons.length === 0 && (
                <li className="px-5 py-3 text-sm text-muted">Aucune séance.</li>
              )}
              {ch.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <PlayCircle className="h-4 w-4 text-accent-2" />
                  <span className="flex-1 truncate text-[14px]">{l.title}</span>
                  {l.isFreePreview && <span className="badge badge-free">Aperçu</span>}
                  <span className="mono text-[11px] text-muted">{formatDuration(l.duration)}</span>
                  <PublishToggle endpoint={`/api/admin/lessons/${l.id}`} initial={l.isPublished} />
                  <ConfirmDelete endpoint={`/api/admin/lessons/${l.id}`} iconOnly confirmText={`Supprimer la séance « ${l.title} » ?`} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
