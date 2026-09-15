"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/catalogue", label: "Cours" },
  { href: "/#methode", label: "Méthode 48" },
  { href: "/#concours", label: "Concours" },
  { href: "/pricing", label: "Tarifs" },
];

export function PublicHeader() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashHref = session?.user.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header
      className={cn(
        "sticky top-0 z-[60] transition",
        scrolled && "border-b border-line bg-bg/80 backdrop-blur-md"
      )}
    >
      <div className="wrap flex h-[72px] items-center gap-7">
        <Logo />
        <nav className="ml-2 hidden gap-7 text-[15.5px] font-medium text-ink-2 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3.5 md:flex">
          {session ? (
            <ButtonLink href={dashHref} variant="dark" size="sm">
              Mon espace
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" size="sm">
                Connexion
              </ButtonLink>
            </>
          )}
        </div>

        <button
          className="ml-auto md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 font-medium text-ink-2"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3">
              {session ? (
                <ButtonLink href={dashHref} variant="dark" size="sm" className="flex-1">
                  Mon espace
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/login" size="sm" className="flex-1">
                    Connexion
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
