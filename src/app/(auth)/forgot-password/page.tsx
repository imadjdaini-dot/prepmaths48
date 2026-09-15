import type { Metadata } from "next";
import Link from "next/link";
import { AuthBrandPanel } from "@/components/layout/auth-brand-panel";
import { Logo } from "@/components/ui/logo";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié — Prép-Maths48" };

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuthBrandPanel />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[404px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-[26px] font-semibold">Mot de passe oublié</h2>
          <p className="mt-1.5 text-[15px] text-muted">
            Entre ton email, nous t&apos;enverrons un lien de réinitialisation.
          </p>
          <div className="mt-7">
            <ForgotForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/login" className="font-semibold text-accent-2">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
