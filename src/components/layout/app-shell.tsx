"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { SidebarNav, type NavItem } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";

/**
 * Coquille d'application (élève / admin) : sidebar fixe + topbar + drawer mobile.
 */
export function AppShell({
  primaryNav,
  secondaryNav,
  user,
  brandHref,
  badge,
  children,
}: {
  primaryNav: NavItem[];
  secondaryNav?: NavItem[];
  user: { name: string; email: string; isAdmin: boolean };
  brandHref: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo href={brandHref} />
        {badge && (
          <span className="mono rounded-md bg-navy px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav items={primaryNav} />
        {secondaryNav && secondaryNav.length > 0 && (
          <>
            <div className="my-4 border-t border-line-2" />
            <SidebarNav items={secondaryNav} />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[252px] bg-surface" >
            <button
              className="absolute right-3 top-4 text-muted"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              <X />
            </button>
            <div onClick={() => setOpen(false)}>{sidebar}</div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-line bg-bg/85 px-5 backdrop-blur-md">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu />
          </button>
          <div className="ml-auto">
            <UserMenu name={user.name} email={user.email} isAdmin={user.isAdmin} />
          </div>
        </header>
        <main className="px-5 py-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
