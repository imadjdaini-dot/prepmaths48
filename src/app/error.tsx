"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-[28px] font-semibold">Une erreur est survenue</h1>
        <p className="mt-2 text-muted">Réessaie, ou reviens un peu plus tard.</p>
        <button onClick={reset} className="btn btn-primary mt-5">
          Réessayer
        </button>
      </div>
    </div>
  );
}
