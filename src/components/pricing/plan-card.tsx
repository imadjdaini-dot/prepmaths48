"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PlanDef } from "@/lib/plans";
import { formatPrice } from "@/lib/utils";

export function PlanCard({
  plan,
  isAuthenticated,
}: {
  plan: PlanDef;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function choose() {
    if (!isAuthenticated) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }
    if (plan.id === "GRATUIT") {
      router.push("/dashboard");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Erreur");
      }
      toast.success(
        "Demande enregistrée ! Suis les instructions de paiement, l'accès sera activé après validation."
      );
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`card flex flex-col p-7 shadow-sm ${
        plan.highlight ? "relative ring-2 ring-accent" : ""
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-7 badge badge-premium">Le plus choisi</span>
      )}
      <h3 className="font-display text-[20px] font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
      <div className="mt-4 font-display text-[34px] font-bold">
        {plan.price === 0 ? "Gratuit" : formatPrice(plan.price * 100)}
        {plan.price > 0 && (
          <span className="text-[14px] font-medium text-muted"> {plan.period}</span>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5 text-[14.5px] text-ink-2">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-green" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={choose}
        disabled={loading}
        className={`btn mt-6 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {plan.cta}
      </button>
    </div>
  );
}
