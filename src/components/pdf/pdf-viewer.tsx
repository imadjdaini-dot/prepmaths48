"use client";

import { FileText } from "lucide-react";

/**
 * Affiche un PDF via notre endpoint protégé (jamais l'URL source directe).
 * Le téléchargement passe par un bouton séparé conditionné côté serveur.
 */
export function PDFViewer({ resourceId, title }: { resourceId: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-2">
      <object
        data={`/api/resources/${resourceId}/file#toolbar=0`}
        type="application/pdf"
        className="h-[72vh] w-full"
        aria-label={title}
      >
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted">
          <FileText className="h-10 w-10" />
          <p className="text-sm">
            Aperçu PDF indisponible dans ce navigateur.
          </p>
        </div>
      </object>
    </div>
  );
}
