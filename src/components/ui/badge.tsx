import { cn } from "@/lib/utils";
import { Crown, Gift, Sparkles, CheckCircle2, Lock } from "lucide-react";

type Variant = "premium" | "free" | "new" | "done" | "locked" | "neutral";

const styles: Record<Variant, string> = {
  premium: "bg-accent-soft text-accent-2",
  free: "badge-free",
  new: "badge-new",
  done: "badge-done",
  locked: "bg-line-2 text-muted",
  neutral: "border border-line bg-surface text-ink-2",
};

const icons: Partial<Record<Variant, React.ReactNode>> = {
  premium: <Crown className="h-3 w-3" />,
  free: <Gift className="h-3 w-3" />,
  new: <Sparkles className="h-3 w-3" />,
  done: <CheckCircle2 className="h-3 w-3" />,
  locked: <Lock className="h-3 w-3" />,
};

export function Badge({
  variant = "neutral",
  children,
  className,
  icon = true,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}) {
  return (
    <span className={cn("badge", styles[variant], className)}>
      {icon && icons[variant]}
      {children}
    </span>
  );
}
