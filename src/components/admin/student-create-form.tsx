"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, X, Loader2, Wand2, Copy, Check } from "lucide-react";
import { LevelTrackFields } from "@/components/forms/level-track-fields";

/** Mot de passe lisible (sans caractères ambigus) pour le transmettre à l'élève. */
function generatePassword(length = 10) {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

type Created = { name: string; email: string; password: string };

/**
 * Création d'un compte élève par l'administrateur (il n'y a pas d'inscription
 * publique). Après création, les identifiants sont affichés une seule fois
 * pour être transmis à l'élève.
 */
export function StudentCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password,
      // fd.get() renvoie null si le champ n'est pas rendu (ex. aucune branche) :
      // String(null) donnerait la chaîne "null", rejetée par la validation.
      level: (fd.get("level") as string | null) || null,
      track: (fd.get("track") as string | null) || null,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Compte élève créé.");
      setCreated({ name: payload.name, email: data.email ?? payload.email, password });
      form.reset();
      setPassword(generatePassword());
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function copyCredentials() {
    if (!created) return;
    const text = [
      "Prép-Maths48 — identifiants",
      `Email : ${created.email}`,
      `Mot de passe : ${created.password}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
        <UserPlus className="h-4 w-4" /> Nouvel élève
      </button>
    );
  }

  return (
    <div className="card w-full space-y-5 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Créer un compte élève</h3>
        <button
          onClick={() => {
            setOpen(false);
            setCreated(null);
          }}
          className="text-muted hover:text-ink"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {created && (
        <div className="rounded-md border border-green/30 bg-green/10 p-4 text-[14px]">
          <p className="font-semibold">Compte créé pour {created.name}</p>
          <p className="mt-1 text-muted">
            Transmets ces identifiants à l&apos;élève — le mot de passe ne sera plus affiché.
          </p>
          <div className="mono mt-2 space-y-0.5 text-[13px]">
            <div>Email : {created.email}</div>
            <div>Mot de passe : {created.password}</div>
          </div>
          <button type="button" onClick={copyCredentials} className="btn btn-ghost btn-sm mt-3">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copié" : "Copier les identifiants"}
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Nom complet</label>
          <div className="input-wrap">
            <input name="name" required minLength={2} placeholder="Prénom Nom" />
          </div>
        </div>
        <div>
          <label className="field-label">Email</label>
          <div className="input-wrap">
            <input name="email" type="email" required placeholder="eleve@email.com" />
          </div>
        </div>

        <LevelTrackFields />

        <div className="sm:col-span-2">
          <label className="field-label">Mot de passe initial</label>
          <div className="flex gap-2">
            <div className="input-wrap flex-1">
              <input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="off"
                className="mono"
              />
            </div>
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="btn btn-ghost btn-sm"
              title="Générer un mot de passe"
            >
              <Wand2 className="h-4 w-4" /> Générer
            </button>
          </div>
          <p className="mt-1 text-[12px] text-muted">8 caractères minimum.</p>
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer le compte
          </button>
        </div>
      </form>
    </div>
  );
}
