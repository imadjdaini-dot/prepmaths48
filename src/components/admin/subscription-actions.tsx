"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { schoolYearEnd } from "@/lib/school-year";

export function SubscriptionActions({
  subscriptionId,
  status,
  endDate,
  label,
}: {
  subscriptionId: string;
  status: string;
  /** Date de fin actuelle au format YYYY-MM-DD, ou null. */
  endDate: string | null;
  /** Élève et offre, affichés dans le modal. */
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(endDate ?? schoolYearEnd());

  async function patch(body: Record<string, unknown>, msg: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success(msg);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  if (status === "PENDING") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => patch({ status: "ACTIVE" }, "Abonnement activé.")}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-green/15 px-2.5 py-1.5 text-[12px] font-semibold text-green"
        >
          <Check className="h-3.5 w-3.5" /> Valider
        </button>
        <button
          onClick={() => patch({ status: "REJECTED" }, "Abonnement rejeté.")}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--red)]"
        >
          <X className="h-3.5 w-3.5" /> Rejeter
        </button>
      </div>
    );
  }

  const isActive = status === "ACTIVE";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Modifier l'abonnement"
        className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/40 p-4">
          <div className="card w-full max-w-sm p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">Modifier l&apos;abonnement</h3>
                <p className="mt-1 truncate text-sm text-muted">{label}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (isActive) patch({ endDate: date }, "Date de fin mise à jour.");
                else patch({ status: "ACTIVE", endDate: date }, "Abonnement réactivé.");
              }}
            >
              <div>
                <label className="field-label">Date de fin</label>
                <div className="input-wrap">
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {isActive && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => patch({ status: "CANCELLED" }, "Abonnement désactivé.")}
                    className="mr-auto inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold text-[color:var(--red)] hover:bg-red-50 disabled:opacity-60"
                  >
                    Désactiver
                  </button>
                )}
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isActive ? "Enregistrer" : "Réactiver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
