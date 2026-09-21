"use client";

// src/app/(student)/appareils/page.tsx
import { useCallback, useEffect, useState } from "react";

type Device = {
  id: string;
  label: string;
  createdAt: string;
  isCurrent: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppareilsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [max, setMax] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      if (!res.ok) throw new Error("load_failed");
      const data = (await res.json()) as { max: number; devices: Device[] };
      setDevices(data.devices);
      setMax(data.max);
      setError(null);
    } catch {
      setError("Impossible de charger tes appareils. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removeDevice(id: string) {
    if (!window.confirm("Déconnecter cet appareil ?")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("delete_failed");
      await load();
    } catch {
      setError("La déconnexion de l'appareil a échoué. Réessaie.");
    } finally {
      setBusyId(null);
    }
  }

  const limitReached = devices.length >= max;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Mes appareils</h1>
      <p className="mt-2 text-sm opacity-70">
        Ton compte peut être utilisé sur {max} appareils au maximum. Si un
        troisième appareil se connecte, le compte est suspendu automatiquement.
      </p>

      {loading ? (
        <p className="mt-8 text-sm opacity-70">Chargement…</p>
      ) : (
        <>
          <p className="mt-6 text-sm font-medium">
            {devices.length} / {max} appareils utilisés
          </p>

          {limitReached && (
            <div
              role="status"
              className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              Limite atteinte. Avant de te connecter sur un nouvel appareil,
              déconnecte ici un appareil que tu n&apos;utilises plus.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {devices.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {d.label}
                    {d.isCurrent && (
                      <span className="ml-2 rounded-full bg-[#F2A93B]/20 px-2 py-0.5 text-xs font-semibold text-[#9a6412]">
                        Cet appareil
                      </span>
                    )}
                  </p>
                  <p className="text-xs opacity-60">
                    Connecté le {formatDate(d.createdAt)}
                  </p>
                </div>

                {!d.isCurrent && (
                  <button
                    type="button"
                    onClick={() => removeDevice(d.id)}
                    disabled={busyId === d.id}
                    className="shrink-0 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50"
                  >
                    {busyId === d.id ? "…" : "Déconnecter"}
                  </button>
                )}
              </li>
            ))}
          </ul>

          {devices.length === 0 && !error && (
            <p className="mt-4 text-sm opacity-70">Aucun appareil enregistré.</p>
          )}
        </>
      )}
    </main>
  );
}
