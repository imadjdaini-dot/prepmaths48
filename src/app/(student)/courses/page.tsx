import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { getMyCourses } from "@/lib/student";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

export default async function MyCoursesPage() {
  const user = await requireUser();
  const courses = await getMyCourses(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Mes cours</h1>
        <p className="mt-1 text-[15px] text-muted">
          Reprends tes cours là où tu t&apos;es arrêté.
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Aucun cours commencé"
          description="Démarre un cours depuis le catalogue, il apparaîtra ici."
          action={<ButtonLink href="/catalogue">Explorer le catalogue</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4">
          {courses.map((cp) => {
            const lessons = cp.course.chapters.flatMap((c) => c.lessons);
            const duration = lessons.reduce((s, l) => s + l.duration, 0);
            return (
              <Link
                key={cp.id}
                href={`/courses/${cp.course.slug}`}
                className="card flex flex-col gap-4 p-5 shadow-sm transition hover:shadow-md md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[18px] font-semibold">
                      {cp.course.title}
                    </h3>
                    {cp.course.isPremium ? (
                      <Badge variant="premium">Premium</Badge>
                    ) : (
                      <Badge variant="free">Gratuit</Badge>
                    )}
                  </div>
                  <p className="mono mt-1 text-[12px] text-muted">
                    {cp.completedLessons}/{cp.totalLessons} séances ·{" "}
                    {formatDuration(duration)}
                  </p>
                  <ProgressBar value={cp.progressPercent} showLabel className="mt-3 max-w-md" />
                </div>
                <span className="btn btn-ghost btn-sm shrink-0">
                  Continuer <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
