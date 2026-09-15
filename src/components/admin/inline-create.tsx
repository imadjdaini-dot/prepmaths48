"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  colSpan?: 1 | 2;
};

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Ajouté.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

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
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.colSpan === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}>
            {f.type !== "checkbox" && <label className="field-label">{f.label}</label>}
            {f.type === "textarea" ? (
              <textarea
                name={f.name}
                required={f.required}
                placeholder={f.placeholder}
                defaultValue={f.defaultValue as string}
                rows={3}
                className="w-full resize-y rounded-md border border-line bg-surface p-3 text-[14px] outline-none focus:border-accent"
              />
            ) : f.type === "select" ? (
              <div className="input-wrap">
                <select name={f.name} defaultValue={f.defaultValue as string}>
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
                  defaultValue={f.defaultValue as string | number}
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
    </div>
  );
}
