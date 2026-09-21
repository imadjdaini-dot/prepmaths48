import Link from "next/link";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  BookOpen,
  Clock,
  Trophy,
  PlayCircle,
  ArrowRight,
} from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { getDashboardData } from "@/lib/student";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { getCourseCards } from "@/lib/queries";
import { formatDuration } from "@/lib/utils";

export default async function DashboardPage() {
  const sessionUser = await requireUser();

  if (!sessionUser?.id) {
    redirect("/login");
  }

  const rawData = await getDashboardData(sessionUser.id);

  // حماية من null دون إعادة التوجيه إلى صفحة الدخول
  const data = rawData ?? {
    user: { name: sessionUser.name },
    globalProgress: 0,
    enrolledCount: 0,
    completedCourses: 0,
    totalWatchedSeconds: 0,
    attempts: [],
    inProgress: [],
    lastProgress: null,
  };

  const recommended = await getCourseCards({ take: 3 });
  const firstName = (data.user?.name ?? sessionUser.name ?? "Élève").split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold">
            Bonjour {firstName} 👋
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {data.globalProgress > 0
              ? "Continue sur ta lancée, chaque séance compte."
              : "Prêt à démarrer ? Choisis un cours et lance-toi."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Progression globale"
          value={`${data.globalProgress}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Cours suivis"
          value={data.enrolledCount}
          icon={<BookOpen className="h-5 w-5" />}
          hint={`${data.completedCourses} terminé(s)`}
        />
        <StatCard
          label="Temps d'apprentissage"
          value={formatDuration(data.totalWatchedSeconds)}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Quiz réalisés"
          value={data.attempts.length}
          icon={<Trophy className="h-5 w-5" />}
        />
      </div>

      {/* Reprendre */}
      {data.lastProgress ? (
        <section className="card overflow-hidden shadow-sm">
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
            <div className="relative grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-navy-2 to-navy-3 md:w-44">
              <PlayCircle className="h-10 w-10 text-white/90" strokeWidth={1.4} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="mono text-[10px] uppercase tracking-wider text-accent-2">
                Reprendre
              </span>
              <h3 className="mt-1 font-display text-[18px] font-semibold">
                {data.lastProgress.lesson.chapter.course.title}
              </h3>
              <p className="text-sm text-muted">
                Séance : {data.lastProgress.lesson.title}
              </p>
            </div>
            <ButtonLink href={`/learn/${data.lastProgress.lesson.id}`} className="shrink-0">
              Continuer <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<PlayCircle className="h-6 w-6" />}
          title="Tu n'as pas encore commencé"
          description="Explore le catalogue et démarre ton premier cours."
          action={<ButtonLink href="/catalogue">Voir le catalogue</ButtonLink>}
        />
      )}

      {/* Cours en cours */}
      {data.inProgress.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-[20px] font-semibold">Cours en cours</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.inProgress.map((cp) => (
              <Link
                key={cp.id}
                href={`/courses/${cp.course.slug}`}
                className="card p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[16px] font-semibold">
                    {cp.course.title}
                  </h3>
                  <span className="mono text-[12px] text-muted">
                    {cp.completedLessons}/{cp.totalLessons}
                  </span>
                </div>
                <ProgressBar value={cp.progressPercent} showLabel className="mt-3" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quiz récents */}
      {data.attempts.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-[20px] font-semibold">Quiz récents</h2>
          <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
            {data.attempts.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{a.quiz.title}</p>
                  <p className="mono text-[11px] text-muted">
                    {a.correctAnswers}/{a.totalQuestions} bonnes réponses
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
        </section>
      )}

      {/* Recommandés */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-semibold">Recommandés pour toi</h2>
          <Link href="/catalogue" className="text-sm font-semibold text-accent-2">
            Voir tout
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </div>
  );
}