import { prisma } from "@/lib/prisma";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";
import { PLAN_LABELS } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green/15 text-green",
  PAID: "bg-green/15 text-green",
  PENDING: "bg-accent-soft text-accent-2",
  REJECTED: "bg-red-50 text-[color:var(--red)]",
  FAILED: "bg-red-50 text-[color:var(--red)]",
  EXPIRED: "bg-line-2 text-muted",
  CANCELLED: "bg-line-2 text-muted",
};

export default async function AdminPaymentsPage() {
  const [subscriptions, payments, revenue] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  const pending = subscriptions.filter((s) => s.status === "PENDING");

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Paiements & abonnements</h1>
        <p className="mt-1 text-[15px] text-muted">
          Revenus encaissés : <b className="text-ink">{formatPrice(revenue._sum.amount ?? 0)}</b>
          {pending.length > 0 && ` · ${pending.length} demande(s) en attente`}
        </p>
      </div>

      {/* Abonnements */}
      <section>
        <h2 className="mb-3 font-display text-[20px] font-semibold">Abonnements</h2>
        {subscriptions.length === 0 ? (
          <EmptyState title="Aucun abonnement" description="Les demandes d'abonnement apparaîtront ici." />
        ) : (
          <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
            {subscriptions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{s.user.name}</p>
                  <p className="mono truncate text-[11px] text-muted">
                    {PLAN_LABELS[s.plan]} · {s.user.email}
                  </p>
                </div>
                <span className={`mono rounded-md px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[s.status] ?? "bg-line-2"}`}>
                  {s.status}
                </span>
                <SubscriptionActions subscriptionId={s.id} status={s.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Paiements */}
      <section>
        <h2 className="mb-3 font-display text-[20px] font-semibold">Historique des paiements</h2>
        {payments.length === 0 ? (
          <EmptyState title="Aucun paiement" description="Les paiements apparaîtront ici." />
        ) : (
          <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{p.user.name}</p>
                  <p className="mono truncate text-[11px] text-muted">
                    {p.plan ? PLAN_LABELS[p.plan] : "—"} · {p.provider} ·{" "}
                    {p.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="mono text-[13px] font-semibold">{formatPrice(p.amount, p.currency)}</span>
                <span className={`mono rounded-md px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[p.status] ?? "bg-line-2"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
