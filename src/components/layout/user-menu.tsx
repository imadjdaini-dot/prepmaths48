"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { initials } from "@/lib/utils";

export function UserMenu({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition hover:border-line-2"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-navy-3 to-navy font-mono text-xs font-bold text-white">
          {initials(name)}
        </span>
        <span className="hidden text-sm font-semibold text-ink sm:block">
          {name.split(" ")[0]}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-line bg-surface shadow-md">
            <div className="border-b border-line-2 px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{name}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
            <div className="p-1.5">
              <MenuLink href="/profile" icon={<UserIcon className="h-4 w-4" />}>
                Mon profil
              </MenuLink>
              {isAdmin ? (
                <MenuLink href="/admin/settings" icon={<Settings className="h-4 w-4" />}>
                  Paramètres
                </MenuLink>
              ) : (
                <MenuLink href="/progress" icon={<Settings className="h-4 w-4" />}>
                  Ma progression
                </MenuLink>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-sm font-medium text-[color:var(--red)] hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-[9px] px-3 py-2 text-sm font-medium text-ink-2 hover:bg-line-2 hover:text-ink"
    >
      {icon}
      {children}
    </Link>
  );
}
