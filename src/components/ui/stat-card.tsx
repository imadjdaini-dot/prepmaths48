import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && (
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent-soft text-accent-2">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-[28px] font-bold leading-none text-ink">
        {value}
      </div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}
