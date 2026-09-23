import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { RecordPayment } from "@/components/admin/record-payment";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";
import { PLAN_LABELS } from "@/types";
import { formatDay, toDay } from "@/lib/school-year";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green/15 text-green",
  PAID: "bg-green/15 text-green",
  PENDING: "bg-accent-soft text-accent-2",
  REJECTED: "bg-red-50 text-[color:var(--red)]",
  FAILED: "bg-red-50 text-[color:var(--red)]",
  EXPIRED: "bg-line-2 text-muted",
  CANCELLED: "bg-line-2 text-muted",
};

// Statuts masqués par défaut dans la liste des abonnements (filtre d'affichage uniquement).
const ARCHIVED_STATUSES = new Set(["CANCELLED", "EXPIRED", "REJECTED"]);

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { historique?: string };
}) {
  const showAll = searchParams.historique === "1";

  const [subscriptions, payments, revenue, students] = await Promise.all([
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
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, concoursAccess: true },
    }),
  ]);

  const now = new Date();
  const pending = subscriptions.filter((s) => s.status === "PENDING");
  const visibleSubscriptions = showAll
    ? subscriptions
    : subscriptions.filter((s) => !ARCHIVED_STATUSES.has(s.status));
  const hiddenCount = subscriptions.length - visibleSubscriptions.length;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Paiements & abonnements</h1>
          <p className="mt-1 text-[15px] text-muted">
            Revenus encaissés : <b className="text-ink">{formatPrice(revenue._sum.amount ?? 0)}</b>
            {pending.length > 0 && ` · ${pending.length} demande(s) en attente`}
          </p>
        </div>
        <RecordPayment students={students} />
      </div>

      {/* Abonnements */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[20px] font-semibold">Abonnements</h2>
            <p className="mono text-[11px] text-muted">
              {showAll
                ? `${subscriptions.length} abonnement(s) · historique complet`
                : `${visibleSubscriptions.length} actif(s) / en attente · ${hiddenCount} archivé(s) masqué(s)`}
            </p>
          </div>
          <Link
            href={showAll ? "/admin/payments" : "/admin/payments?historique=1"}
            scroll={false}
            className={`btn btn-sm ${showAll ? "btn-ghost" : "btn-primary"}`}
          >
            {showAll ? "Afficher les actifs uniquement" : "Afficher tout l'historique"}
          </Link>
        </div>
        {visibleSubscriptions.length === 0 ? (
          <EmptyState
            title="Aucun abonnement"
            description={
              showAll
                ? "Les demandes d'abonnement apparaîtront ici."
                : "Aucun abonnement actif ou en attente. Affichez l'historique pour voir les autres."
            }
          />
        ) : (
          <div className="card divide-y divide-line-2 overflow-hidden shadow-sm">
            {visibleSubscriptions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{s.user.name}</p>
                  <p className="mono truncate text-[11px] text-muted">
                    {PLAN_LABELS[s.plan]} · {s.user.email}
                  </p>
                </div>
                <span
                  className={`mono text-[11px] ${
                    s.status === "ACTIVE" && s.endDate && s.endDate < now ? "text-[color:var(--red)]" : "text-muted"
                  }`}
                >
                  {s.endDate ? `Fin : ${formatDay(s.endDate)}` : "Sans date de fin"}
                </span>
                <span className={`mono rounded-md px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[s.status] ?? "bg-line-2"}`}>
                  {s.status}
                </span>
                <SubscriptionActions
                  subscriptionId={s.id}
                  status={s.status}
                  endDate={s.endDate ? toDay(s.endDate) : null}
                  label={`${s.user.name} · ${PLAN_LABELS[s.plan]}`}
                />
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
                    {formatDay(p.createdAt)}
                    {p.providerRef && ` · ${p.providerRef}`}
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
