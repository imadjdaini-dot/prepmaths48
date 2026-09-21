import Link from "next/link";
import { BarChart3, Clock, CheckCircle2, Target, TrendingDown } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { courseVisibilityWhere, getAudience } from "@/lib/content-access";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDuration } from "@/lib/utils";

export default async function ProgressPage() {
  const user = await requireUser();
  const audience = await getAudience(user.id);

  const [courseProgress, attempts, watched, completedCount] = await Promise.all([
    prisma.courseProgress.findMany({
      // Uniquement les cours visibles pour cet élève (évite les liens vers des cours en 404).
      where: {
        userId: user.id,
        course: courseVisibilityWhere(audience ?? { level: null, track: null }),
      },
      include: { course: true },
      orderBy: { progressPercent: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: user.id },
      include: { quiz: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lessonProgress.aggregate({
      where: { userId: user.id },
      _sum: { watchedSeconds: true },
    }),
    prisma.lessonProgress.count({ where: { userId: user.id, isCompleted: true } }),
  ]);

  const avgScore =
    attempts.length === 0
      ? 0
      : Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);

  // Points faibles : quiz dont le meilleur score < 60 %
  const bestByQuiz = new Map<string, { title: string; best: number }>();
  attempts.forEach((a) => {
    const cur = bestByQuiz.get(a.quizId);
    if (!cur || a.score > cur.best) {
      bestByQuiz.set(a.quizId, { title: a.quiz.title, best: a.score });
    }
  });
  const weakPoints = [...bestByQuiz.values()].filter((q) => q.best < 60);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Ma progression</h1>
        <p className="mt-1 text-[15px] text-muted">
          Suis tes statistiques et identifie tes points faibles.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Séances terminées" value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Temps d'apprentissage" value={formatDuration(watched._sum.watchedSeconds ?? 0)} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Score moyen quiz" value={`${avgScore}%`} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard label="Quiz réalisés" value={attempts.length} icon={<Target className="h-5 w-5" />} />
      </div>

      {/* Progression par cours */}
      <section>
        <h2 className="mb-3 font-display text-[20px] font-semibold">Progression par cours</h2>
        {courseProgress.length === 0 ? (
          <EmptyState title="Pas encore de progression" description="Commence un cours pour voir tes statistiques ici." />
        ) : (
          <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
            {courseProgress.map((cp) => (
              <Link
                key={cp.id}
                href={`/courses/${cp.course.slug}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{cp.course.title}</p>
                  <p className="mono text-[11px] text-muted">
                    {cp.completedLessons}/{cp.totalLessons} séances
                  </p>
                </div>
                <ProgressBar value={cp.progressPercent} showLabel className="w-48" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Points faibles */}
      {weakPoints.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-[20px] font-semibold">
            <TrendingDown className="h-5 w-5 text-[color:var(--red)]" /> Points à retravailler
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {weakPoints.map((w) => (
              <div key={w.title} className="card flex items-center justify-between p-4 shadow-sm">
                <span className="text-[15px] font-medium">{w.title}</span>
                <span className="mono rounded-md bg-red-50 px-2 py-1 text-[13px] font-bold text-[color:var(--red)]">
                  {w.best}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historique quiz */}
      <section>
        <h2 className="mb-3 font-display text-[20px] font-semibold">Historique des quiz</h2>
        {attempts.length === 0 ? (
          <EmptyState title="Aucun quiz réalisé" description="Tes résultats de quiz apparaîtront ici." />
        ) : (
          <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
            {attempts.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{a.quiz.title}</p>
                  <p className="mono text-[11px] text-muted">
                    {a.correctAnswers}/{a.totalQuestions} · {formatDuration(a.duration)} ·{" "}
                    {a.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`mono rounded-md px-2.5 py-1 text-[13px] font-bold ${
                    a.score >= 70
                      ? "bg-green/15 text-green"
                      : a.score >= 50
                        ? "bg-accent-soft text-accent-2"
                        : "bg-red-50 text-[color:var(--red)]"
                  }`}
                >
                  {a.score}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
