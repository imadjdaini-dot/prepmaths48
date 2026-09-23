import { prisma } from "@/lib/prisma";
import { InlineCreate, InlineEdit } from "@/components/admin/inline-create";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDuration } from "@/lib/utils";
import { lessonFields } from "@/lib/admin-fields";

export default async function AdminLessonsPage() {
  const [lessons, chapters] = await Promise.all([
    prisma.lesson.findMany({
      orderBy: { updatedAt: "desc" },
      include: { chapter: { include: { course: { select: { title: true } } } } },
    }),
    prisma.chapter.findMany({
      orderBy: [{ courseId: "asc" }, { order: "asc" }],
      include: { course: { select: { title: true } } },
    }),
  ]);
  const chapterOptions = chapters.map((c) => ({ value: c.id, label: `${c.course.title} — ${c.title}` }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Séances</h1>
        <p className="mt-1 text-[15px] text-muted">Gère les séances vidéo.</p>
      </div>

      <InlineCreate
        title="Nouvelle séance"
        buttonLabel="Nouvelle séance"
        endpoint="/api/admin/lessons"
        fields={lessonFields(chapterOptions)}
      />

      {lessons.length === 0 ? (
        <EmptyState title="Aucune séance" description="Crée une séance et rattache-la à un chapitre." />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {lessons.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{l.title}</p>
                <p className="mono text-[11px] text-muted">
                  {l.chapter.course.title} · {l.chapter.title} · {l.videoProvider}
                </p>
              </div>
              <span className="mono text-[11px] text-muted">{formatDuration(l.duration)}</span>
              {l.isFreePreview && <span className="badge badge-free">Aperçu</span>}
              <PublishToggle endpoint={`/api/admin/lessons/${l.id}`} initial={l.isPublished} />
              <InlineEdit
                title={`Modifier « ${l.title} »`}
                endpoint={`/api/admin/lessons/${l.id}`}
                fields={lessonFields(chapterOptions, l)}
              />
              <ConfirmDelete endpoint={`/api/admin/lessons/${l.id}`} iconOnly confirmText={`Supprimer « ${l.title} » ?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
