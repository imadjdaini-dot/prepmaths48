import { prisma } from "@/lib/prisma";
import { InlineCreate, InlineEdit } from "@/components/admin/inline-create";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { chapterFields } from "@/lib/admin-fields";

export default async function AdminChaptersPage() {
  const [chapters, courses] = await Promise.all([
    prisma.chapter.findMany({
      orderBy: [{ courseId: "asc" }, { order: "asc" }],
      include: { course: { select: { title: true } }, _count: { select: { lessons: true } } },
    }),
    prisma.course.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.title }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Chapitres</h1>
          <p className="mt-1 text-[15px] text-muted">Organise les chapitres par cours.</p>
        </div>
      </div>

      <InlineCreate
        title="Nouveau chapitre"
        buttonLabel="Nouveau chapitre"
        endpoint="/api/admin/chapters"
        fields={chapterFields(courseOptions)}
      />

      {chapters.length === 0 ? (
        <EmptyState title="Aucun chapitre" description="Crée un chapitre et rattache-le à un cours." />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {chapters.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{ch.title}</p>
                <p className="mono text-[11px] text-muted">
                  {ch.course.title} · {ch._count.lessons} séance(s)
                </p>
              </div>
              <PublishToggle endpoint={`/api/admin/chapters/${ch.id}`} initial={ch.isPublished} />
              <InlineEdit
                title={`Modifier « ${ch.title} »`}
                endpoint={`/api/admin/chapters/${ch.id}`}
                fields={chapterFields(courseOptions, ch)}
              />
              <ConfirmDelete endpoint={`/api/admin/chapters/${ch.id}`} iconOnly confirmText={`Supprimer « ${ch.title} » ?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
