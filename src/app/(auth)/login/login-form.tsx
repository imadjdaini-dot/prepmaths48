"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      const suspended = res.error === "ACCOUNT_SUSPENDED" || res.error === "DEVICE_LIMIT";
      toast.error(authErrorMessage(res.error), { duration: suspended ? 10000 : 4000 });
      return;
    }
    toast.success("Connexion réussie !");
    const callback = params.get("callbackUrl") || "/dashboard";
    router.push(callback);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="field-label">Email</label>
        <div className="input-wrap">
          <Mail className="h-[18px] w-[18px] text-muted" />
          <input name="email" type="email" required placeholder="toi@email.com" />
        </div>
      </div>

      <div>
        <label className="field-label">Mot de passe</label>
        <div className="input-wrap">
          <Lock className="h-[18px] w-[18px] text-muted" />
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="text-muted hover:text-ink"
            aria-label="Afficher le mot de passe"
          >
            {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[13.5px]">
        <label className="flex items-center gap-2 text-ink-2">
          <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" />
          Se souvenir de moi
        </label>
        <a href="/forgot-password" className="font-semibold text-accent-2">
          Mot de passe oublié ?
        </a>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Se connecter <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
