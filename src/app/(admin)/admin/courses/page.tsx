import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { KIND_LABELS } from "@/types";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { chapters: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Cours</h1>
          <p className="mt-1 text-[15px] text-muted">Gère le catalogue de cours.</p>
        </div>
        <ButtonLink href="/admin/courses/new" size="sm">
          <PlusCircle className="h-4 w-4" /> Nouveau cours
        </ButtonLink>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="Aucun cours"
          description="Crée ton premier cours pour démarrer."
          action={<ButtonLink href="/admin/courses/new">Nouveau cours</ButtonLink>}
        />
      ) : (
        <div className="card overflow-hidden shadow-sm">
          <div className="hidden grid-cols-[1fr_120px_120px_140px_120px] gap-3 border-b border-line-2 bg-surface-2 px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-muted md:grid">
            <span>Titre</span>
            <span>Accès</span>
            <span>Type</span>
            <span>Statut</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-line-2">
            {courses.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1fr_120px_120px_140px_120px] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{c.title}</p>
                  <p className="mono text-[11px] text-muted">
                    {c._count.chapters} chapitre(s) · /{c.slug}
                  </p>
                </div>
                <div>
                  {c.isPremium ? (
                    <Badge variant="premium">Premium</Badge>
                  ) : (
                    <Badge variant="free">Gratuit</Badge>
                  )}
                </div>
                <div className="mono text-[12px] text-muted">
                  {KIND_LABELS[c.kind]}
                </div>
                <div>
                  <PublishToggle endpoint={`/api/admin/courses/${c.id}`} initial={c.isPublished} />
                </div>
                <div className="flex justify-start gap-2 md:justify-end">
                  <Link
                    href={`/admin/courses/${c.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <ConfirmDelete
                    endpoint={`/api/admin/courses/${c.id}`}
                    iconOnly
                    confirmText={`Supprimer « ${c.title} » et tout son contenu ?`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
