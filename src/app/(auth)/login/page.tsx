import type { Metadata } from "next";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion — Prép-Maths48" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[404px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-[26px] font-semibold">Content de te revoir 👋</h2>
          <p className="mt-1.5 text-[15px] text-muted">
            Connecte-toi pour reprendre ton parcours.
          </p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Pas encore de compte ? Les comptes élèves sont créés par l&apos;administration
            Prép-Maths48 : contacte ton professeur pour obtenir tes identifiants.
          </p>
        </div>
      </div>
    </div>
  );
}