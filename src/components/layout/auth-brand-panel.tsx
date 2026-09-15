import { Logo } from "@/components/ui/logo";
import { CheckCircle2, GraduationCap, Trophy, BarChart3 } from "lucide-react";

const PROOFS = [
  { icon: GraduationCap, text: "Cours alignés sur le programme du Bac marocain" },
  { icon: Trophy, text: "Prépa concours par leçons : fonctions, limites, suites, sommes, arctan" },
  { icon: BarChart3, text: "Suivi de progression et quiz corrigés" },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-col overflow-hidden bg-gradient-to-b from-navy to-navy-2 p-12 text-[#e9eef7] lg:flex">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(680px 340px at 82% 8%, color-mix(in srgb,var(--accent) 26%, transparent), transparent 60%), radial-gradient(520px 320px at 5% 110%, color-mix(in srgb,var(--cyan) 16%, transparent), transparent 60%)",
        }}
      />
      <div className="relative z-10">
        <Logo light href="/" />
      </div>

      <div className="relative z-10 my-auto max-w-md">
        <div className="eyebrow mb-5 text-accent">La méthode 48</div>
        <h1 className="font-display text-[38px] font-semibold leading-tight tracking-tight text-white">
          Réussis le Bac et prépare les concours, étape par étape.
        </h1>
        <p className="mt-4 text-[16px] text-[#9fb0c9]">
          Rejoins les élèves qui transforment les maths en point fort grâce à un
          parcours clair et structuré.
        </p>

        <div className="mt-9 space-y-4">
          {PROOFS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.text} className="flex items-center gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border border-white/10 bg-white/[0.08] text-accent">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[14.5px] text-[#cdd8e8]">{p.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 text-[13px] text-[#9fb0c9]">
        <CheckCircle2 className="h-4 w-4 text-green" />
        Paiement sécurisé · Annulation à tout moment
      </div>
    </div>
  );
}
