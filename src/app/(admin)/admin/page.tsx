import Link from "next/link";
import { Users, BookOpen, CreditCard, TrendingUp, PlusCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { PLAN_LABELS } from "@/types";

export default async function AdminDashboard() {
  const [students, courses, publishedCourses, revenueAgg, recentStudents, recentSubs, avgProgress] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.user.findMany({
        where: { role: "STUDENT" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: true },
      }),
      prisma.courseProgress.aggregate({ _avg: { progressPercent: true } }),
    ]);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold">Vue d&apos;ensemble</h1>
          <p className="mt-1 text-[15px] text-muted">Pilotage de la plateforme.</p>
        </div>
        <ButtonLink href="/admin/courses/new" size="sm">
          <PlusCircle className="h-4 w-4" /> Nouveau cours
        </ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Élèves" value={students} icon={<Users className="h-5 w-5" />} />
        <StatCard
          label="Cours"
          value={courses}
          icon={<BookOpen className="h-5 w-5" />}
          hint={`${publishedCourses} publié(s)`}
        />
        <StatCard
          label="Revenus"
          value={formatPrice(revenueAgg._sum.amount ?? 0)}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          label="Progression moy."
          value={`${Math.round(avgProgress._avg.progressPercent ?? 0)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Inscriptions récentes */}
        <section className="card overflow-hidden shadow-sm">
          <div className="border-b border-line-2 px-5 py-3.5">
            <h2 className="font-display text-[16px] font-semibold">Inscriptions récentes</h2>
          </div>
          <div className="divide-y divide-line-2">
            {recentStudents.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted">Aucun élève pour le moment.</p>
            )}
            {recentStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{s.name}</p>
                  <p className="mono truncate text-[11px] text-muted">{s.email}</p>
                </div>
                <span className="mono text-[11px] text-muted">
                  {s.createdAt.toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/students" className="block border-t border-line-2 px-5 py-3 text-sm font-semibold text-accent-2">
            Voir tous les élèves →
          </Link>
        </section>

        {/* Abonnements récents */}
        <section className="card overflow-hidden shadow-sm">
          <div className="border-b border-line-2 px-5 py-3.5">
            <h2 className="font-display text-[16px] font-semibold">Abonnements récents</h2>
          </div>
          <div className="divide-y divide-line-2">
            {recentSubs.length === 0 && (
              <p className="px-5 py-6 text-sm text-muted">Aucun abonnement.</p>
            )}
            {recentSubs.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{sub.user.name}</p>
                  <p className="mono truncate text-[11px] text-muted">{PLAN_LABELS[sub.plan]}</p>
                </div>
                <StatusPill status={sub.status} />
              </div>
            ))}
          </div>
          <Link href="/admin/payments" className="block border-t border-line-2 px-5 py-3 text-sm font-semibold text-accent-2">
            Gérer les paiements →
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green/15 text-green",
    PENDING: "bg-accent-soft text-accent-2",
    REJECTED: "bg-red-50 text-[color:var(--red)]",
    EXPIRED: "bg-line-2 text-muted",
    CANCELLED: "bg-line-2 text-muted",
  };
  return (
    <span className={`mono rounded-md px-2 py-0.5 text-[10px] font-bold ${map[status] ?? "bg-line-2"}`}>
      {status}
    </span>
  );
}
