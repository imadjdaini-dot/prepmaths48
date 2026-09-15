import { prisma } from "@/lib/prisma";
import { StudentActions } from "@/components/admin/student-actions";
import { StudentCreateForm } from "@/components/admin/student-create-form";
import { StudentLevelEditor } from "@/components/admin/student-level-editor";
import { EmptyState } from "@/components/ui/empty-state";
import { initials } from "@/lib/utils";

export default async function AdminStudentsPage() {
  const now = new Date();
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
          plan: { not: "GRATUIT" },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: { id: true },
      },
      _count: { select: { courseProgress: true, quizAttempts: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Élèves</h1>
        <p className="mt-1 text-[15px] text-muted">
          {students.length} compte(s) élève. Les comptes sont créés ici par l&apos;administrateur.
        </p>
      </div>

      <StudentCreateForm />

      {students.length === 0 ? (
        <EmptyState
          title="Aucun élève"
          description="Crée le premier compte élève avec le bouton « Nouvel élève »."
        />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {students.map((s) => {
            const hasPremium = s.subscriptions.length > 0;
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-3 to-navy font-mono text-[12px] font-bold text-white">
                  {initials(s.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{s.name}</p>
                  <p className="mono truncate text-[11px] text-muted">{s.email}</p>
                </div>
                <StudentLevelEditor userId={s.id} level={s.level} track={s.track} />
                <div className="mono hidden text-[11px] text-muted sm:block">
                  {s._count.courseProgress} cours · {s._count.quizAttempts} quiz
                </div>
                <StudentActions userId={s.id} isActive={s.isActive} hasPremium={hasPremium} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
