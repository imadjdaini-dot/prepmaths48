import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logo Prép-Maths48 — pastille mono "48" + nom. */
export function Logo({
  href = "/",
  className,
  light = false,
}: {
  href?: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 font-display text-[20px] font-bold tracking-tight",
        light ? "text-white" : "text-ink",
        className
      )}
    >
      <span className="relative rounded-[9px] bg-accent px-2.5 py-1 font-mono text-[15px] font-bold text-accent-ink">
        48
      </span>
      <span>
        Prép<span className="text-accent-2">-</span>Maths
      </span>
    </Link>
  );
}
