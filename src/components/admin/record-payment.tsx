"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { schoolYearEnd, todayDay } from "@/lib/school-year";
import { getPlan } from "@/lib/plans";

export type PaymentStudent = {
  id: string;
  name: string;
  email: string;
  concoursAccess: boolean;
};

type Offer = "COURS" | "CONCOURS";

// Montants préremplis = prix officiels de src/lib/plans.ts (source unique).
const OFFERS: { id: Offer; label: string; price: number }[] = (["COURS", "CONCOURS"] as const).map((id) => ({
  id,
  label: getPlan(id)?.name ?? id,
  price: getPlan(id)?.price ?? 0,
}));

/** Bouton + modal d'enregistrement d'un paiement manuel (virement, espèces…). */
export function RecordPayment({ students }: { students: PaymentStudent[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<PaymentStudent | null>(null);
  const [plan, setPlan] = useState<Offer>("COURS");
  const [amount, setAmount] = useState(String(OFFERS[0].price));
  const [paidAt, setPaidAt] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, students]);

  function openModal() {
    setQuery("");
    setStudent(null);
    setPlan("COURS");
    setAmount(String(OFFERS[0].price));
    setPaidAt(todayDay());
    setEndDate(schoolYearEnd());
    setNote("");
    setOpen(true);
  }

  function chooseOffer(o: Offer) {
    setPlan(o);
    setAmount(String(OFFERS.find((x) => x.id === o)!.price));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!student) {
      toast.error("Choisis un élève.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.id, plan, amount: Number(amount), paidAt, endDate, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success(`Paiement enregistré — abonnement ${plan === "COURS" ? "Cours" : "Concours"} actif pour ${student.name}.`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={openModal} className="btn btn-primary btn-sm">
        <Plus className="h-4 w-4" /> Enregistrer un paiement
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-navy/40 p-4">
          <div className="card my-auto w-full max-w-lg p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[16px] font-semibold">Enregistrer un paiement</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              {/* Élève */}
              <div className="sm:col-span-2">
                <label className="field-label">Élève</label>
                {student ? (
                  <div className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{student.name}</p>
                      <p className="mono truncate text-[11px] text-muted">{student.email}</p>
                    </div>
                    <button type="button" onClick={() => setStudent(null)} className="text-muted hover:text-ink">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="input-wrap">
                      <Search className="h-4 w-4 text-muted" />
                      <input
                        autoFocus
                        placeholder="Nom ou email…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    {query.trim() && (
                      <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-line bg-surface shadow-lg">
                        {matches.length === 0 ? (
                          <p className="px-3 py-2.5 text-[13px] text-muted">Aucun élève trouvé.</p>
                        ) : (
                          matches.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setStudent(s)}
                              className="block w-full px-3 py-2 text-left hover:bg-surface-2"
                            >
                              <p className="truncate text-[14px] font-medium">{s.name}</p>
                              <p className="mono truncate text-[11px] text-muted">{s.email}</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Offre */}
              <div className="sm:col-span-2">
                <label className="field-label">Offre</label>
                <div className="grid grid-cols-2 gap-2">
                  {OFFERS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => chooseOffer(o.id)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-[14px] font-semibold transition",
                        plan === o.id ? "border-accent bg-accent-soft text-accent-2" : "border-line bg-surface hover:bg-surface-2"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {plan === "CONCOURS" && student && !student.concoursAccess && (
                <div className="flex gap-2 rounded-md bg-accent-soft px-3 py-2.5 text-[13px] text-accent-2 sm:col-span-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    L&apos;accès Concours de cet élève sera activé automatiquement avec ce paiement.
                  </span>
                </div>
              )}

              <div>
                <label className="field-label">Montant (MAD)</label>
                <div className="input-wrap">
                  <input
                    type="number"
                    min={1}
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Date du paiement</label>
                <div className="input-wrap">
                  <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="field-label">Date de fin d&apos;abonnement</label>
                <div className="input-wrap">
                  <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="field-label">Note / référence du virement (optionnel)</label>
                <div className="input-wrap">
                  <input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. VIR-123456" />
                </div>
              </div>

              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
                  Annuler
                </button>
                <button type="submit" disabled={loading || !student} className="btn btn-primary btn-sm">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
