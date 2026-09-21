"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StudentActionsProps {
  userId: string;
  isActive: boolean;
  hasPremium: boolean;
  concoursAccess: boolean;
}

export function StudentActions({
  userId,
  isActive,
  hasPremium,
  concoursAccess,
}: StudentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Basculer l'état Actif / Inactif
  const toggleActive = async () => {
    setLoading(true);
    await fetch(`/api/admin/students/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    router.refresh();
  };

  // Basculer l'état Premium
  const togglePremium = async () => {
    setLoading(true);
    await fetch(`/api/admin/students/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantPremium: !hasPremium }),
    });
    setLoading(false);
    router.refresh();
  };

  // Basculer l'accès au contenu des concours
  const toggleConcours = async () => {
    setLoading(true);
    await fetch(`/api/admin/students/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concoursAccess: !concoursAccess }),
    });
    setLoading(false);
    router.refresh();
  };

  // 📍 Supprimer l'élève définitivement
  const handleDeleteStudent = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cet élève définitivement ?")) return;

    setLoading(true);
    const res = await fetch(`/api/admin/students/${userId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Erreur lors de la suppression de l'élève");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePremium}
        disabled={loading}
        className={`mono rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
          hasPremium
            ? "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {hasPremium ? "👑 Premium" : "Activer Premium"}
      </button>

      <button
        onClick={toggleConcours}
        disabled={loading}
        title="Accès au contenu des concours"
        className={`mono rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
          concoursAccess
            ? "bg-sky-500/15 text-sky-700 hover:bg-sky-500/25"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {concoursAccess ? "🏆 Concours" : "Activer Concours"}
      </button>

      <button
        onClick={toggleActive}
        disabled={loading}
        className={`mono rounded-md px-2.5 py-1 text-[12px] font-medium transition ${
          isActive
            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
            : "bg-red-500/15 text-red-600 hover:bg-red-500/25"
        }`}
      >
        {isActive ? "Actif" : "Inactif"}
      </button>

      {/* 📍 Bouton Supprimer */}
      <button
        onClick={handleDeleteStudent}
        disabled={loading}
        className="mono rounded-md bg-red-500/10 px-2.5 py-1 text-[12px] font-medium text-red-600 hover:bg-red-500/20 transition disabled:opacity-50"
      >
        Supprimer
      </button>
    </div>
  );
}