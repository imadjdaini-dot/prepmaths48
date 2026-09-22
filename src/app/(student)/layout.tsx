import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/permissions";
import type { NavItem } from "@/components/layout/sidebar-nav";

// Espace élève : toujours rendu à la demande (session + données live).
export const dynamic = "force-dynamic";

const primary: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: "dashboard", exact: true },
  { href: "/live", label: "Direct", icon: "live" },
  { href: "/courses", label: "Mes cours", icon: "courses" },
  { href: "/progress", label: "Mon parcours", icon: "route" },
  { href: "/catalogue", label: "Catalogue", icon: "catalogue" },
];

const secondary: NavItem[] = [
  { href: "/profile", label: "Profil", icon: "settings" },
  { href: "/appareils", label: "Mes appareils", icon: "devices" },
  { href: "/pricing", label: "Abonnement", icon: "award" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // L'admin n'a pas de sessions d'appareils : on lui masque « Mes appareils ».
  const secondaryItems =
    user.role === "ADMIN"
      ? secondary.filter((item) => item.href !== "/appareils")
      : secondary;
  return (
    <AppShell
      brandHref="/dashboard"
      primaryNav={primary}
      secondaryNav={secondaryItems}
      user={{ name: user.name, email: user.email, isAdmin: user.role === "ADMIN" }}
    >
      {children}
    </AppShell>
  );
}
