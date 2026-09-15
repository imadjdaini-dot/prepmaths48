import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="mono text-[13px] uppercase tracking-widest text-accent-2">Erreur 404</p>
        <h1 className="mt-2 font-display text-[40px] font-semibold">Page introuvable</h1>
        <p className="mt-2 text-muted">
          La page que tu cherches n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn btn-ghost">
            Accueil
          </Link>
          <Link href="/catalogue" className="btn btn-primary">
            Voir les cours
          </Link>
        </div>
      </div>
    </div>
  );
}
