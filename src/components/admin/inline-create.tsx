"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Loader2, Pencil } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | null;
  colSpan?: 1 | 2;
};

/** Envoie les champs du formulaire en JSON vers `endpoint`, puis rafraîchit la page. */
function useFieldsSubmit(fields: Field[], endpoint: string, method: "POST" | "PATCH", successMsg: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>, onDone: () => void) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (f.type === "checkbox") payload[f.name] = fd.get(f.name) === "on";
      else if (f.type === "number") payload[f.name] = Number(fd.get(f.name) || 0);
      else payload[f.name] = fd.get(f.name) ?? "";
    });

    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success(successMsg);
      onDone();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return { loading, submit };
}

/** Grille de champs partagée par la création et l'édition. */
function FieldsForm({
  fields,
  loading,
  onSubmit,
}: {
  fields: Field[];
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.colSpan === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}>
          {f.type !== "checkbox" && <label className="field-label">{f.label}</label>}
          {f.type === "textarea" ? (
            <textarea
              name={f.name}
              required={f.required}
              placeholder={f.placeholder}
              defaultValue={(f.defaultValue ?? "") as string}
              rows={3}
              className="w-full resize-y rounded-md border border-line bg-surface p-3 text-[14px] outline-none focus:border-accent"
            />
          ) : f.type === "select" ? (
            <div className="input-wrap">
              <select name={f.name} defaultValue={(f.defaultValue ?? undefined) as string | undefined}>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : f.type === "checkbox" ? (
            <label className="flex items-center gap-2.5 text-[14px] font-medium">
              <input
                type="checkbox"
                name={f.name}
                defaultChecked={Boolean(f.defaultValue)}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              {f.label}
            </label>
          ) : (
            <div className="input-wrap">
              <input
                type={f.type === "number" ? "number" : "text"}
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={(f.defaultValue ?? "") as string | number}
              />
            </div>
          )}
        </div>
      ))}
      <div className="sm:col-span-2">
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer
        </button>
      </div>
    </form>
  );
}

/**
 * Formulaire de création générique (admin) : ouvre un panneau, poste un JSON
 * vers `endpoint`, rafraîchit la liste.
 */
export function InlineCreate({
  title,
  endpoint,
  fields,
  buttonLabel = "Ajouter",
}: {
  title: string;
  endpoint: string;
  fields: Field[];
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { loading, submit } = useFieldsSubmit(fields, endpoint, "POST", "Ajouté.");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
        <Plus className="h-4 w-4" /> {buttonLabel}
      </button>
    );
  }

  return (
    <div className="card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-[16px] font-semibold">{title}</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>
      <FieldsForm fields={fields} loading={loading} onSubmit={(e) => submit(e, () => setOpen(false))} />
    </div>
  );
}

/**
 * Bouton crayon + modal d'édition : mêmes champs que la création, préremplis
 * via `defaultValue`, envoyés en PATCH vers `endpoint`.
 */
export function InlineEdit({
  title,
  endpoint,
  fields,
}: {
  title: string;
  endpoint: string;
  fields: Field[];
}) {
  const [open, setOpen] = useState(false);
  const { loading, submit } = useFieldsSubmit(fields, endpoint, "PATCH", "Modifications enregistrées.");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Modifier"
        className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-surface-2"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-navy/40 p-4">
          <div className="card my-auto w-full max-w-2xl p-5 text-left shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="truncate font-display text-[16px] font-semibold">{title}</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FieldsForm fields={fields} loading={loading} onSubmit={(e) => submit(e, () => setOpen(false))} />
          </div>
        </div>
      )}
    </>
  );
}
