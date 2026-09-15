"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

/** Bascule un champ booléen via PATCH { [field]: value }. */
export function PublishToggle({
  endpoint,
  field = "togglePublish",
  initial,
  labels = ["Publié", "Masqué"],
}: {
  endpoint: string;
  field?: string;
  initial: boolean;
  labels?: [string, string];
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !on;
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error();
      setOn(next);
      router.refresh();
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
        on ? "bg-green/15 text-green" : "bg-line-2 text-muted"
      }`}
    >
      {on ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {on ? labels[0] : labels[1]}
    </button>
  );
}
