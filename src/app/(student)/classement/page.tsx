import { Trophy } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/permissions";
import { getAudience } from "@/lib/content-access";
import { prisma } from "@/lib/prisma";
import { challengeStreak, publicName, streakBadge, STREAK_BADGES } from "@/lib/daily-challenge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { formatLevelTrack } from "@/types";

const TOP = 10;

type Row = { userId: string; points: number; rank: number };

export default async function ClassementPage() {
  const sessionUser = await requireUser();
  const me = await getAudience(sessionUser.id);

  if (!me?.level) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="Classement indisponible"
          description="Ton niveau n'est pas encore renseigné : le classement compare les élèves d'un même niveau et d'une même branche."
        />
      </div>
    );
  }

  // Jamais de classement global : uniquement les élèves du même niveau ET de la
  // même branche que l'élève connecté (même source de vérité : getAudience).
  const peers: Prisma.UserWhereInput = {
    role: "STUDENT",
    isActive: true,
    level: me.level,
    track: me.track,
  };

  const totals = await prisma.dailyChallengeAttempt.groupBy({
    by: ["userId"],
    where: { user: peers },
    _sum: { pointsEarned: true },
    orderBy: [{ _sum: { pointsEarned: "desc" } }, { userId: "asc" }],
  });

  // Rang « sportif » : deux élèves à égalité partagent le même rang (1, 1, 3…).
  const ranked: Row[] = [];
  totals.forEach((t, i) => {
    const points = t._sum.pointsEarned ?? 0;
    const rank = i > 0 && points === ranked[i - 1].points ? ranked[i - 1].rank : i + 1;
    ranked.push({ userId: t.userId, points, rank });
  });

  const top = ranked.slice(0, TOP);
  const mine = ranked.find((r) => r.userId === sessionUser.id) ?? null;
  const mineOutsideTop = mine && !top.includes(mine) ? mine : null;
  const shownIds = [...top, ...(mineOutsideTop ? [mineOutsideTop] : [])].map((r) => r.userId);

  const [users, attempts] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: shownIds } }, select: { id: true, name: true } }),
    prisma.dailyChallengeAttempt.findMany({
      where: { userId: { in: [...shownIds, sessionUser.id] } },
      select: { userId: true, dailyChallenge: { select: { date: true } } },
    }),
  ]);
  const nameById = new Map(users.map((u) => [u.id, publicName(u.name)]));
  const datesByUser = new Map<string, Date[]>();
  for (const a of attempts) {
    const list = datesByUser.get(a.userId) ?? [];
    list.push(a.dailyChallenge.date);
    datesByUser.set(a.userId, list);
  }
  const streakOf = (userId: string) => challengeStreak(datesByUser.get(userId) ?? []);

  const myStreak = streakOf(sessionUser.id);
  const myBadge = streakBadge(myStreak);

  function RowView({ row }: { row: Row }) {
    const badge = streakBadge(streakOf(row.userId));
    const isMe = row.userId === sessionUser.id;
    return (
      <div className={cn("flex items-center gap-4 px-5 py-3", isMe && "bg-accent-soft")}>
        <span className="mono w-8 text-[14px] font-bold text-muted">#{row.rank}</span>
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
          {nameById.get(row.userId) ?? "Élève"}
          {isMe && <span className="ml-2 text-[12px] text-accent-2">(toi)</span>}
        </span>
        {badge && (
          <span title={badge.label} className="text-[18px]">
            {badge.emoji}
          </span>
        )}
        <span className="mono text-[14px] font-bold">{row.points} pts</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Classement</h1>
        <p className="mt-1 text-[15px] text-muted">
          Points du défi du jour · {formatLevelTrack(me.level, me.track)}
        </p>
      </div>

      <section className="card p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p className="mono text-[11px] uppercase tracking-wider text-muted">Ton rang</p>
            <p className="font-display text-[26px] font-bold">{mine ? `#${mine.rank}` : "—"}</p>
          </div>
          <div>
            <p className="mono text-[11px] uppercase tracking-wider text-muted">Tes points</p>
            <p className="font-display text-[26px] font-bold">{mine?.points ?? 0}</p>
          </div>
          <div>
            <p className="mono text-[11px] uppercase tracking-wider text-muted">Série</p>
            <p className="font-display text-[26px] font-bold">
              {myStreak} jour{myStreak > 1 ? "s" : ""} {myBadge?.emoji}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...STREAK_BADGES].reverse().map((b) => (
            <span
              key={b.days}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[12.5px]",
                myStreak >= b.days ? "border-accent bg-accent-soft font-semibold" : "border-line text-muted opacity-60"
              )}
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      </section>

      {top.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="Personne n'a encore de points"
          description="Fais le défi du jour depuis ton tableau de bord pour ouvrir le classement."
        />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {top.map((r) => (
            <RowView key={r.userId} row={r} />
          ))}
          {mineOutsideTop && (
            <>
              <div className="px-5 py-1 text-center text-muted">…</div>
              <RowView row={mineOutsideTop} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
