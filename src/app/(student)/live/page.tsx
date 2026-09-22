import { Radio } from "lucide-react";
import { requireUser } from "@/lib/permissions";
import { getAudience, canSeeCourse } from "@/lib/content-access";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveSessionCard } from "@/components/live/live-session-card";

export default async function LivePage() {
  const sessionUser = await requireUser();
  const audience = await getAudience(sessionUser.id);

  const sessions = audience
    ? (
        await prisma.liveSession.findMany({
          where: { isPublished: true },
          orderBy: { startAt: "asc" },
        })
      ).filter((s) => canSeeCourse(audience, { level: s.level, track: s.track }))
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Direct</h1>
        <p className="mt-1 text-[15px] text-muted">
          Les prochaines séances en direct programmées pour ton niveau.
        </p>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Radio className="h-6 w-6" />}
          title="Aucune session programmée"
          description="Reviens plus tard : les prochaines sessions live apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <LiveSessionCard
              key={s.id}
              title={s.title}
              description={s.description}
              meetUrl={s.meetUrl}
              startAt={s.startAt.toISOString()}
              durationMinutes={s.durationMinutes}
              level={s.level}
              track={s.track}
            />
          ))}
        </div>
      )}
    </div>
  );
}
