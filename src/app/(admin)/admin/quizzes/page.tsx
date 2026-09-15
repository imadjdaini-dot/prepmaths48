import Link from "next/link";
import { HelpCircle, Settings2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InlineCreate } from "@/components/admin/inline-create";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminQuizzesPage() {
  const [quizzes, courses] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        course: { select: { title: true } },
        lesson: { select: { title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    }),
    prisma.course.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Quiz</h1>
        <p className="mt-1 text-[15px] text-muted">Crée des quiz et gère leurs questions.</p>
      </div>

      <InlineCreate
        title="Nouveau quiz"
        buttonLabel="Nouveau quiz"
        endpoint="/api/admin/quizzes"
        fields={[
          { name: "title", label: "Titre", required: true, colSpan: 2 },
          { name: "description", label: "Description", type: "textarea" },
          {
            name: "courseId",
            label: "Cours associé (optionnel)",
            type: "select",
            colSpan: 2,
            options: [{ value: "", label: "— Aucun —" }, ...courses.map((c) => ({ value: c.id, label: c.title }))],
          },
          { name: "isPublished", label: "Publié", type: "checkbox", defaultValue: true },
        ]}
      />

      {quizzes.length === 0 ? (
        <EmptyState icon={<HelpCircle className="h-6 w-6" />} title="Aucun quiz" description="Crée ton premier quiz." />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {quizzes.map((q) => (
            <div key={q.id} className="flex items-center gap-3 px-5 py-3.5">
              <HelpCircle className="h-5 w-5 text-accent-2" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{q.title}</p>
                <p className="mono text-[11px] text-muted">
                  {q.course?.title ?? q.lesson?.title ?? "Indépendant"} · {q._count.questions} question(s) · {q._count.attempts} tentative(s)
                </p>
              </div>
              <Link
                href={`/admin/quizzes/${q.id}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
              >
                <Settings2 className="h-4 w-4" /> Questions
              </Link>
              <PublishToggle endpoint={`/api/admin/quizzes/${q.id}`} initial={q.isPublished} />
              <ConfirmDelete endpoint={`/api/admin/quizzes/${q.id}`} iconOnly confirmText={`Supprimer « ${q.title} » ?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
