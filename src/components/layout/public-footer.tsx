import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            Maîtrise les maths du Bac marocain et prépare les concours post-bac avec
            une méthode claire, étape par étape.
          </p>
        </div>
        <FooterCol
          title="Plateforme"
          links={[
            { href: "/catalogue", label: "Catalogue" },
            { href: "/pricing", label: "Tarifs" },
            { href: "/login", label: "Connexion" },
          ]}
        />
        <FooterCol
          title="Concours"
          links={[
            { href: "/catalogue?level=CONCOURS", label: "Fonctions" },
            { href: "/catalogue?level=CONCOURS", label: "Limites" },
            { href: "/catalogue?level=CONCOURS", label: "Suites" },
            { href: "/catalogue?level=CONCOURS", label: "Sommes" },
            { href: "/catalogue?level=CONCOURS", label: "Arctan" },
          ]}
        />
        <FooterCol
          title="Ressources"
          links={[
            { href: "/#methode", label: "Méthode 48" },
            { href: "/#faq", label: "FAQ" },
            { href: "/#temoignages", label: "Témoignages" },
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col items-center justify-between gap-3 py-5 text-[13px] text-muted md:flex-row">
          <span>© {new Date().getFullYear()} Prép-Maths48. Tous droits réservés.</span>
          <span className="mono text-[11px]">Fait avec ❤ pour les élèves marocains</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink">
        {title}
      </h4>
      <ul className="space-y-2 text-sm text-muted">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
