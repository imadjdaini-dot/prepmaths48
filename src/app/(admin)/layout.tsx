import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/permissions";
import type { NavItem } from "@/components/layout/sidebar-nav";

// Espace admin : toujours rendu à la demande (session + données live).
export const dynamic = "force-dynamic";

const primary: NavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: "dashboard", exact: true },
  { href: "/admin/courses", label: "Cours", icon: "courses" },
  { href: "/admin/chapters", label: "Chapitres", icon: "layers" },
  { href: "/admin/lessons", label: "Séances", icon: "lessons" },
  { href: "/admin/resources", label: "Ressources PDF", icon: "resources" },
  { href: "/admin/quizzes", label: "Quiz", icon: "quiz" },
  { href: "/admin/live", label: "Sessions live", icon: "live" },
];

const secondary: NavItem[] = [
  { href: "/admin/students", label: "Élèves", icon: "students" },
  { href: "/admin/payments", label: "Paiements", icon: "payments" },
  { href: "/admin/settings", label: "Paramètres", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <AppShell
      brandHref="/admin"
      badge="Admin"
      primaryNav={primary}
      secondaryNav={secondary}
      user={{ name: user.name, email: user.email, isAdmin: true }}
    >
      {children}
    </AppShell>
  );
}
