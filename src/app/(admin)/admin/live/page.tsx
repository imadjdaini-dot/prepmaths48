import { Radio } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LiveSessionForm } from "@/components/admin/live-session-form";
import { PublishToggle } from "@/components/admin/publish-toggle";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLevelTrack } from "@/types";

function formatDate(d: Date): string {
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminLivePage() {
  const sessions = await prisma.liveSession.findMany({
    orderBy: { startAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Sessions live</h1>
        <p className="mt-1 text-[15px] text-muted">
          Planifie des séances en direct sur Google Meet et publie-les pour tes élèves.
        </p>
      </div>

      <LiveSessionForm />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Radio className="h-6 w-6" />}
          title="Aucune session live"
          description="Planifie ta première session en direct."
        />
      ) : (
        <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
              <Radio className="h-5 w-5 shrink-0 text-accent-2" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{s.title}</p>
                <p className="mono text-[11px] text-muted">
                  {formatDate(s.startAt)} · {s.durationMinutes} min
                  {(s.level || s.track) && ` · ${formatLevelTrack(s.level, s.track)}`}
                </p>
              </div>
              <PublishToggle endpoint={`/api/admin/live/${s.id}`} initial={s.isPublished} />
              <ConfirmDelete
                endpoint={`/api/admin/live/${s.id}`}
                iconOnly
                confirmText={`Supprimer la session « ${s.title} » ?`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
