// Génère des PDF de démonstration valides dans public/demo.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "demo");
mkdirSync(outDir, { recursive: true });

function buildPdf(lines) {
  const content =
    "BT /F1 22 Tf 60 780 Td (" +
    lines[0].replace(/[()\\]/g, "") +
    ") Tj ET\n" +
    lines
      .slice(1)
      .map(
        (l, i) =>
          `BT /F1 13 Tf 60 ${740 - i * 24} Td (${l.replace(/[()\\]/g, "")}) Tj ET`
      )
      .join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

writeFileSync(
  join(outDir, "fiche-synthese.pdf"),
  buildPdf([
    "Prep-Maths48 - Fiche de synthese",
    "",
    "Document de demonstration.",
    "En production, ce PDF serait la vraie fiche du cours,",
    "servie via un lien temporaire securise.",
  ])
);

writeFileSync(
  join(outDir, "exercices.pdf"),
  buildPdf([
    "Prep-Maths48 - Exercices",
    "",
    "Serie d'exercices de demonstration.",
    "1) Calculer la limite en 0 de (sin x)/x.",
    "2) Deriver f(x) = x^3 - 2x + 1.",
    "3) Etudier le sens de variation de f.",
  ])
);

console.log("Demo PDFs generated in public/demo");
