"use client";

// src/components/ui/math-text.tsx
import { Fragment, useMemo } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/**
 * Affiche un texte contenant des formules LaTeX au milieu de texte normal.
 * Formats reconnus (ceux utilisés par l'admin dans les descriptions/questions) :
 *   - \( ... \)   → maths en ligne
 *   - \[ ... \]   → maths en bloc (sur sa propre ligne)
 *   - $$ ... $$   → maths en bloc
 *   - $ ... $     → maths en ligne
 * Le texte hors de ces délimiteurs est affiché tel quel (les retours à la
 * ligne sont conservés). Une formule invalide n'interrompt pas le reste du
 * texte : elle s'affiche simplement en rouge à l'endroit où elle est.
 */

// Un seul passage global : chaque alternative capture son propre contenu.
const MATH_PATTERN =
  /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;

type Segment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; block: boolean };

function splitSegments(source: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MATH_PATTERN.lastIndex = 0;
  while ((match = MATH_PATTERN.exec(source))) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: source.slice(lastIndex, match.index) });
    }
    const [, block1, inline1, block2, inline2] = match;
    if (block1 !== undefined) segments.push({ kind: "math", value: block1, block: true });
    else if (inline1 !== undefined) segments.push({ kind: "math", value: inline1, block: false });
    else if (block2 !== undefined) segments.push({ kind: "math", value: block2, block: true });
    else if (inline2 !== undefined) segments.push({ kind: "math", value: inline2, block: false });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < source.length) {
    segments.push({ kind: "text", value: source.slice(lastIndex) });
  }
  return segments;
}

function MathError({ children }: { children: string }) {
  return <span className="text-[color:var(--red)]">{children}</span>;
}

export function MathText({
  children,
  className,
  as: Tag = "p",
}: {
  children: string | null | undefined;
  className?: string;
  as?: "p" | "span" | "div";
}) {
  const segments = useMemo(() => splitSegments(children ?? ""), [children]);

  if (!children) return null;

  return (
    // dir="auto" : la direction (RTL pour l'arabe, LTR pour le français) est
    // déterminée par le premier caractère fort de CE bloc, indépendamment de
    // la direction (LTR) du reste de l'interface.
    <Tag className={className} dir="auto">
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          // whiteSpace: pre-line garde les sauts de ligne du texte source.
          // unicodeBidi: plaintext isole chaque ligne : un mot français au
          // milieu d'une phrase arabe (ou l'inverse) garde sa propre
          // direction sans perturber l'ordre du reste de la ligne.
          return (
            <span key={i} style={{ whiteSpace: "pre-line", unicodeBidi: "plaintext" }}>
              {seg.value}
            </span>
          );
        }
        // Les formules sont toujours en LTR (chiffres, rac, parenthèses…).
        // dir="ltr" + unicodeBidi: isolate empêchent le moteur bidi de
        // mélanger l'ordre des symboles avec le texte arabe environnant.
        return (
          <span key={i} dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {seg.block ? (
              // Conteneur de défilement : une formule en bloc trop large (mobile)
              // défile horizontalement au lieu de déborder de l'écran.
              // <span> en display:block (et non <div>) pour rester valide dans un <p>.
              <span className="block max-w-full overflow-x-auto overflow-y-hidden py-1">
                <BlockMath math={seg.value} renderError={() => <MathError>{seg.value}</MathError>} />
              </span>
            ) : (
              <InlineMath math={seg.value} renderError={() => <MathError>{seg.value}</MathError>} />
            )}
          </span>
        );
      })}
    </Tag>
  );
}