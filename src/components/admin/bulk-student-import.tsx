"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, X, Loader2, Wand2, Copy, Check } from "lucide-react";
import { LevelTrackFields } from "@/components/forms/level-track-fields";
import { generatePassword } from "@/lib/generate-password";
import { BULK_STUDENTS_MAX } from "@/lib/constants";

type Row = { name: string; email: string };
type Result = {
  created: Row[];
  skipped: { email: string; reason: string }[];
  password: string;
};

/**
 * Découpe le texte collé : une ligne par élève, « Nom, email » ou « Nom<Tab>email »
 * (copier-coller depuis Excel). Le nom s'arrête au premier séparateur ; l'email
 * est le champ suivant (d'éventuelles colonnes en plus sont ignorées).
 */
function parseRows(text: string): Row[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.search(/[,\t]/);
      if (i === -1) return { name: line, email: "" };
      return { name: line.slice(0, i).trim(), email: line.slice(i + 1).split(/[,\t]/)[0].trim() };
    });
}

/**
 * Import groupé d'élèves par l'administrateur : même niveau/branche et même
 * mot de passe pour toute la liste.
 */
export function BulkStudentImport() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState(() => generatePassword());
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  const lineCount = parseRows(text).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rows = parseRows(text);
    if (rows.length === 0) {
      toast.error("Colle au moins une ligne « Nom, email ».");
      return;
    }
    if (rows.length > BULK_STUDENTS_MAX) {
      toast.error(`${BULK_STUDENTS_MAX} élèves maximum par import (${rows.length} lignes).`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          // Voir student-create-form : null si le champ n'est pas rendu.
          level: (fd.get("level") as string | null) || null,
          track: (fd.get("track") as string | null) || null,
          rows,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setResult({ created: data.created, skipped: data.skipped, password });
      if (data.created.length > 0) {
        toast.success(`${data.created.length} compte(s) créé(s).`);
        setText("");
        setPassword(generatePassword());
        router.refresh();
      } else {
        toast.error("Aucun compte créé.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function copyCredentials() {
    if (!result) return;
    const lines = [
      ...result.created.map((r) => `${r.name} — ${r.email}`),
      `Mot de passe (commun) : ${result.password}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
        <Users className="h-4 w-4" /> Importer des élèves
      </button>
    );
  }

  return (
    <div className="card w-full space-y-5 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">Importer des élèves</h3>
        <button
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
          className="text-muted hover:text-ink"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="rounded-md border border-green/30 bg-green/10 p-4 text-[14px]">
            <p className="font-semibold">Créés ({result.created.length})</p>
            {result.created.length > 0 ? (
              <>
                <p className="mt-1 text-muted">
                  Transmets ces identifiants aux élèves — le mot de passe ne sera plus affiché.
                </p>
                <ul className="mono mt-2 space-y-0.5 text-[13px]">
                  {result.created.map((r) => (
                    <li key={r.email}>
                      {r.name} — {r.email}
                    </li>
                  ))}
                  <li className="pt-1 font-semibold">Mot de passe (commun) : {result.password}</li>
                </ul>
                <button type="button" onClick={copyCredentials} className="btn btn-ghost btn-sm mt-3">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié" : "Copier les identifiants"}
                </button>
              </>
            ) : (
              <p className="mt-1 text-muted">Aucun compte créé.</p>
            )}
          </div>

          {result.skipped.length > 0 && (
            <div className="rounded-md border border-line bg-surface-2 p-4 text-[14px]">
              <p className="font-semibold">Ignorés ({result.skipped.length})</p>
              <ul className="mono mt-2 space-y-0.5 text-[13px]">
                {result.skipped.map((s, i) => (
                  <li key={`${s.email}-${i}`}>
                    {s.email} — <span className="text-muted">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <LevelTrackFields />

        <div className="sm:col-span-2">
          <label className="field-label">Mot de passe commun</label>
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
          <p className="mt-1 text-[12px] text-muted">8 caractères minimum. Le même pour tous les élèves importés.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Élèves (un par ligne)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            required
            placeholder={"Nom complet, email@exemple.com\nSara Alaoui, sara.alaoui@exemple.com\nYoussef Benali\tyoussef@exemple.com"}
            className="mono w-full resize-y rounded-md border border-line bg-surface p-3 text-[13px] outline-none focus:border-accent"
          />
          <p className="mt-1 text-[12px] text-muted">
            Séparateur : virgule ou tabulation (copier-coller depuis Excel). {lineCount} ligne(s) —{" "}
            {BULK_STUDENTS_MAX} maximum.
          </p>
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Importer
          </button>
        </div>
      </form>
    </div>
  );
}
