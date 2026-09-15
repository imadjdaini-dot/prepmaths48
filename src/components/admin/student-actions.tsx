"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, ShieldOff, ShieldCheck } from "lucide-react";

export function StudentActions({
  userId,
  isActive,
  hasPremium,
}: {
  userId: string;
  isActive: boolean;
  hasPremium: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>, msg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(msg);
      router.refresh();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => patch({ grantPremium: !hasPremium }, hasPremium ? "Premium révoqué." : "Premium activé.")}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold ${
          hasPremium ? "bg-accent-soft text-accent-2" : "bg-line-2 text-ink-2"
        }`}
        title={hasPremium ? "Révoquer le premium" : "Activer le premium"}
      >
        <Crown className="h-3.5 w-3.5" /> {hasPremium ? "Premium" : "Activer"}
      </button>
      <button
        onClick={() => patch({ isActive: !isActive }, isActive ? "Compte désactivé." : "Compte réactivé.")}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold ${
          isActive ? "bg-green/15 text-green" : "bg-red-50 text-[color:var(--red)]"
        }`}
        title={isActive ? "Désactiver" : "Réactiver"}
      >
        {isActive ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
        {isActive ? "Actif" : "Inactif"}
      </button>
    </div>
  );
}
