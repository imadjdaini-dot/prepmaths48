import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  showLabel = false,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="progress flex-1">
        <i style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="mono shrink-0 text-[11px] text-muted">{pct}%</span>
      )}
    </div>
  );
}
