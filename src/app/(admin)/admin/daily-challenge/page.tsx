import { Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DailyChallengeForm } from "@/components/admin/daily-challenge-form";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDay } from "@/lib/school-year";
import {
  DAILY_BASE_POINTS,
  DAILY_SCORE_BONUS,
  todayChallengeDate,
} from "@/lib/daily-challenge";
import { formatLevelTrack } from "@/types";

export default async function AdminDailyChallengePage() {
  const [challenges, quizzes] = await Promise.all([
    prisma.dailyChallenge.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        quiz: { select: { title: true } },
        _count: { select: { attempts: true } },
      },
    }),
    prisma.quiz.findMany({
      where: { isPublished: true, questions: { some: {} } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);
  const today = todayChallengeDate().getTime();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Défi du jour</h1>
        <p className="mt-1 text-[15px] text-muted">
          Choisis chaque jour un quiz comme défi. Chaque élève ne peut le faire qu&apos;une
          fois : {DAILY_BASE_POINTS} points + jusqu&apos;à {DAILY_SCORE_BONUS} points de bonus
          selon le score.
        </p>
      </div>

      <DailyChallengeForm quizzes={quizzes} />

      {challenges.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="Aucun défi"
          description="Crée ton premier défi du jour."
        />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {challenges.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
              <Target className="h-5 w-5 shrink-0 text-accent-2" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{c.quiz.title}</p>
                <p className="mono text-[11px] text-muted">
                  {formatDay(c.date)}
                  {c.date.getTime() === today && " (aujourd'hui)"} ·{" "}
                  {c.level || c.track ? formatLevelTrack(c.level, c.track) : "Tous les élèves"} ·{" "}
                  {c._count.attempts} participation{c._count.attempts > 1 ? "s" : ""}
                </p>
              </div>
              <ConfirmDelete
                endpoint={`/api/admin/daily-challenge/${c.id}`}
                iconOnly
                confirmText={`Supprimer le défi du ${formatDay(c.date)} ? Les ${c._count.attempts} participation(s) et leurs points seront aussi supprimés.`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
