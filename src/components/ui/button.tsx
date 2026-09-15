import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "ghost" | "dark" | "white";
type Size = "md" | "lg" | "sm";

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  dark: "btn-dark",
  white: "btn-white",
};
const sizes: Record<Size, string> = { md: "", lg: "btn-lg", sm: "btn-sm" };

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  ...props
}: CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={cn("btn", variants[variant], sizes[size], className)}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { href: string }) {
  return (
    <Link
      href={href}
      className={cn("btn", variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
