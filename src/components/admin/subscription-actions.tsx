"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function SubscriptionActions({
  subscriptionId,
  status,
}: {
  subscriptionId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: string, msg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
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

  if (status !== "PENDING") {
    return <span className="mono text-[11px] text-muted">—</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setStatus("ACTIVE", "Abonnement activé.")}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md bg-green/15 px-2.5 py-1.5 text-[12px] font-semibold text-green"
      >
        <Check className="h-3.5 w-3.5" /> Valider
      </button>
      <button
        onClick={() => setStatus("REJECTED", "Abonnement rejeté.")}
        disabled={loading}
        className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--red)]"
      >
        <X className="h-3.5 w-3.5" /> Rejeter
      </button>
    </div>
  );
}
