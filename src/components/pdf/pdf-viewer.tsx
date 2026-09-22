"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileText, Loader2, ZoomIn, ZoomOut } from "lucide-react";

// Le "worker" PDF.js est un script séparé qui fait le vrai travail de
// décodage. On le sert depuis un CDN, à la version exacte du package
// installé : le laisser empaqueter par Next.js/Terser casse le build
// (le fichier .mjs du worker utilise des instructions ES module que le
// minifieur de production ne sait pas traiter dans ce contexte). Le
// fichier PDF lui-même continue de transiter uniquement par notre route
// protégée (/api/resources/.../file), jamais par ce CDN.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.2;
const MAX_PAGE_WIDTH = 820;

/**
 * Affiche un PDF via notre endpoint protégé (jamais l'URL source directe).
 * Rendu par PDF.js sur <canvas> — contrairement au lecteur natif du
 * navigateur (<object>/<embed>), ceci fonctionne aussi sur mobile, où la
 * plupart des navigateurs n'ont pas de lecteur PDF intégré.
 */
export function PDFViewer({ resourceId, title }: { resourceId: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fileUrl = `/api/resources/${resourceId}/file`;
  const pageWidth = Math.min(containerWidth, MAX_PAGE_WIDTH) * scale;

  if (failed) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 overflow-hidden rounded-md border border-line bg-surface-2 p-12 text-center text-muted"
        aria-label={title}
      >
        <FileText className="h-10 w-10" />
        <p className="text-sm">Ce fichier n&apos;a pas pu être chargé.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface-2" aria-label={title}>
      {numPages !== null && (
        <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2">
          <span className="mono text-[12px] text-muted">
            {numPages} page{numPages > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - 0.15).toFixed(2)))}
              className="rounded-md p-1.5 text-ink-2 hover:bg-line-2"
              aria-label="Réduire"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + 0.15).toFixed(2)))}
              className="rounded-md p-1.5 text-ink-2 hover:bg-line-2"
              aria-label="Agrandir"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="scroll-thin max-h-[75vh] overflow-auto bg-line-2/40 p-2">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={() => setFailed(true)}
          loading={
            <div className="flex items-center justify-center gap-2 p-12 text-muted">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement du document…
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted">
              <FileText className="h-10 w-10" />
              <p className="text-sm">Ce fichier n&apos;a pas pu être chargé.</p>
            </div>
          }
        >
          {numPages !== null &&
            containerWidth > 0 &&
            Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                width={pageWidth}
                className="mx-auto mb-2 shadow-sm last:mb-0"
                loading=""
              />
            ))}
        </Document>
      </div>
    </div>
  );
}