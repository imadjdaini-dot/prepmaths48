import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ResourceUpload } from "@/components/admin/resource-upload";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminResourcesPage() {
  const [resources, courses, lessons] = await Promise.all([
    prisma.resource.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        course: { select: { title: true } },
        lesson: { select: { title: true } },
      },
    }),
    prisma.course.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
    prisma.lesson.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: { chapter: { include: { course: { select: { title: true } } } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Ressources PDF</h1>
        <p className="mt-1 text-[15px] text-muted">Téléverse et rattache les fiches aux cours/séances.</p>
      </div>

      <ResourceUpload
        courses={courses.map((c) => ({ value: c.id, label: c.title }))}
        lessons={lessons.map((l) => ({
          value: l.id,
          label: `${l.chapter.course.title} — ${l.title}`,
        }))}
      />

      {resources.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Aucune ressource" description="Ajoute ta première fiche PDF." />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {resources.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-3.5">
              <FileText className="h-5 w-5 text-accent-2" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{r.title}</p>
                <p className="mono text-[11px] text-muted">
                  {r.lesson?.title ?? r.course?.title ?? "Indépendant"} · {r.fileUrl}
                </p>
              </div>
              <PublishToggle
                endpoint={`/api/admin/resources/${r.id}`}
                field="toggleDownload"
                initial={r.allowDownload}
                labels={["Téléchargeable", "Lecture seule"]}
              />
              <PublishToggle endpoint={`/api/admin/resources/${r.id}`} initial={r.isPublished} />
              <ConfirmDelete endpoint={`/api/admin/resources/${r.id}`} iconOnly confirmText={`Supprimer « ${r.title} » ?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
