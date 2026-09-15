import Link from "next/link";
import { Clock, PlayCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Level, Track } from "@prisma/client";
import { formatLevelTrack } from "@/types";
import { formatDuration } from "@/lib/utils";

export type CourseCardData = {
  slug: string;
  title: string;
  shortDescription: string | null;
  level: Level | null;
  track: Track | null;
  kind: string;
  isPremium: boolean;
  lessonCount: number;
  totalDuration: number;
  progress?: number; // 0-100 si inscrit
};

export function CourseCard({ course }: { course: CourseCardData }) {
  const concours = course.kind === "CONCOURS";
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card group flex flex-col overflow-hidden shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Vignette */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-navy-2 to-navy-3">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, color-mix(in srgb,var(--cyan) 60%, transparent), transparent 55%)",
          }}
        />
        <div className="absolute inset-0 grid place-items-center text-white/90">
          <PlayCircle className="h-11 w-11" strokeWidth={1.4} />
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          {course.isPremium ? (
            <Badge variant="premium">Premium</Badge>
          ) : (
            <Badge variant="free">Gratuit</Badge>
          )}
          {concours && <Badge variant="new" icon={false}>Concours</Badge>}
        </div>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mono mb-1.5 text-[10.5px] uppercase tracking-wider text-accent-2">
          {formatLevelTrack(course.level, course.track) || "Tous niveaux"}
        </div>
        <h3 className="font-display text-[17px] font-semibold leading-tight text-ink">
          {course.title}
        </h3>
        {course.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-[13.5px] text-muted">
            {course.shortDescription}
          </p>
        )}

        <div className="mono mt-3 flex items-center gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" /> {course.lessonCount} séances
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(course.totalDuration)}
          </span>
        </div>

        {course.progress !== undefined ? (
          <div className="mt-3">
            <ProgressBar value={course.progress} showLabel />
          </div>
        ) : (
          <span className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-accent-2 group-hover:gap-2">
            Voir le cours <ArrowRight className="h-4 w-4 transition-all" />
          </span>
        )}
      </div>
    </Link>
  );
}
