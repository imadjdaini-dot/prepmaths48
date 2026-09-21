"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Route,
  Grid3x3,
  Award,
  Layers,
  PlaySquare,
  FileText,
  HelpCircle,
  Users,
  CreditCard,
  Settings,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";

// Les composants d'icône (fonctions) ne peuvent pas être passés d'un Server
// Component à un Client Component. On passe donc une clé sérialisable et on
// résout l'icône ici, côté client.
const ICONS = {
  dashboard: LayoutDashboard,
  courses: BookOpen,
  route: Route,
  catalogue: Grid3x3,
  award: Award,
  layers: Layers,
  lessons: PlaySquare,
  resources: FileText,
  quiz: HelpCircle,
  students: Users,
  payments: CreditCard,
  settings: Settings,
  devices: MonitorSmartphone,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon: IconKey;
  badge?: string | number;
  exact?: boolean;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium transition",
              active
                ? "bg-navy text-white"
                : "text-ink-2 hover:bg-line-2 hover:text-ink"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span
                className={cn(
                  "mono rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-accent-soft text-accent-2"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
