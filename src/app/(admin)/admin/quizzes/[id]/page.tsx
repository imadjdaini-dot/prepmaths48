import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InlineCreate, InlineEdit } from "@/components/admin/inline-create";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { questionFields } from "@/lib/admin-fields";
import { DIFFICULTY_LABELS } from "@/types";

export default async function AdminQuizQuestionsPage({
  params,
}: {
  params: { id: string };
}) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/quizzes" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Retour aux quiz
      </Link>
      <div>
        <h1 className="font-display text-[26px] font-semibold">{quiz.title}</h1>
        <p className="mt-1 text-[15px] text-muted">{quiz.questions.length} question(s)</p>
      </div>

      <InlineCreate
        title="Nouvelle question"
        buttonLabel="Ajouter une question"
        endpoint="/api/admin/questions"
        fields={[
          { name: "quizId", label: "quizId", type: "text", defaultValue: quiz.id, colSpan: 2 },
          ...questionFields(undefined, quiz.questions.length),
        ]}
      />

      {quiz.questions.length === 0 ? (
        <EmptyState title="Aucune question" description="Ajoute la première question du quiz." />
      ) : (
        <div className="space-y-3">
          {quiz.questions.map((q, i) => (
            <div key={q.id} className="card p-5 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="mono text-[12px] text-muted">Q{i + 1}</span>
                <p className="flex-1 font-medium">{q.statement}</p>
                <span className="badge badge-new">{DIFFICULTY_LABELS[q.difficulty]}</span>
                <InlineEdit
                  title={`Modifier la question Q${i + 1}`}
                  endpoint={`/api/admin/questions/${q.id}`}
                  fields={questionFields(q)}
                />
                <ConfirmDelete endpoint={`/api/admin/questions/${q.id}`} iconOnly confirmText="Supprimer cette question ?" />
              </div>
              <ul className="mono mt-2 space-y-0.5 text-[13px] text-ink-2">
                {[
                  ["A", q.optionA],
                  ["B", q.optionB],
                  ["C", q.optionC],
                  ["D", q.optionD],
                  ["E", q.optionE],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <li key={k} className={q.correctAnswer === k ? "font-bold text-green" : ""}>
                      {k}. {v} {q.correctAnswer === k ? "✓" : ""}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
