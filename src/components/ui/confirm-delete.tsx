"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Bouton de suppression avec confirmation, qui appelle un endpoint DELETE.
 */
export function ConfirmDelete({
  endpoint,
  label = "Supprimer",
  confirmText = "Confirmer la suppression ? Cette action est irréversible.",
  redirectTo,
  iconOnly = false,
  className,
}: {
  endpoint: string;
  label?: string;
  confirmText?: string;
  redirectTo?: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec de la suppression");
      }
      toast.success("Supprimé.");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-2 text-sm font-semibold text-[color:var(--red)] transition hover:bg-red-50",
          className
        )}
      >
        <Trash2 className="h-4 w-4" />
        {!iconOnly && label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/40 p-4">
          <div className="card w-full max-w-sm p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Confirmation</h3>
            <p className="mt-2 text-sm text-muted">{confirmText}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[color:var(--red)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
