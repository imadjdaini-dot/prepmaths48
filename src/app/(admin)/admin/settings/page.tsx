import { Info, ShieldCheck, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";

export default async function AdminSettingsPage() {
  const [courses, lessons, quizzes, resources] = await Promise.all([
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.resource.count(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Paramètres</h1>
        <p className="mt-1 text-[15px] text-muted">Configuration générale de la plateforme.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cours" value={courses} />
        <StatCard label="Séances" value={lessons} />
        <StatCard label="Quiz" value={quizzes} />
        <StatCard label="Ressources" value={resources} />
      </div>

      <div className="card space-y-4 p-6 shadow-sm">
        <Row
          icon={<Video className="h-5 w-5" />}
          title="Protection vidéo"
          desc="Lecteur sécurisé : URLs signées temporaires, filigrane à l'email de l'élève, téléchargement natif désactivé. Compatible Bunny Stream / Cloudflare Stream / Vimeo privé."
        />
        <Row
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Accès premium"
          desc="Vérifié côté serveur sur chaque ressource (vidéo, PDF, quiz). Les routes admin et élève sont protégées par middleware."
        />
        <Row
          icon={<Info className="h-5 w-5" />}
          title="Paiement"
          desc="Paiement manuel marocain opérationnel (validation par l'admin). L'intégration Stripe est prête à être branchée via les variables d'environnement."
        />
      </div>

      <p className="mono text-center text-[11px] text-muted">
        Les paramètres avancés (langues, branding, intégrations) seront ajoutés ici.
      </p>
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent-2">
        {icon}
      </span>
      <div>
        <h3 className="font-display text-[16px] font-semibold">{title}</h3>
        <p className="mt-1 text-[14px] text-muted">{desc}</p>
      </div>
    </div>
  );
}
