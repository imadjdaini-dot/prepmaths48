import type { Metadata } from "next";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import { CatalogueFilters } from "@/components/courses/catalogue-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { getCourseCards } from "@/lib/queries";
import { auth } from "@/lib/auth";
import { getAudience } from "@/lib/content-access";

export const metadata: Metadata = { title: "Catalogue — Prép-Maths48" };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { track?: string; kind?: string; level?: string; premium?: string };
}) {
  // Élève connecté : uniquement les cours de son niveau / sa branche.
  // Visiteur (non connecté) : tout le catalogue, page vitrine.
  const session = await auth();
  const audience = session?.user?.id ? await getAudience(session.user.id) : null;

  const filters = {
    track: searchParams.track,
    kind: searchParams.kind,
    level: searchParams.level,
    premium: searchParams.premium as "free" | "premium" | undefined,
  };
  const courses = await getCourseCards(filters, audience);

  // Résultat vide pour un élève connecté : est-ce à cause de son accès (et non des filtres) ?
  // On ne refait la requête (sans restriction) que dans ce cas précis.
  const blockedByAccess =
    courses.length === 0 && audience !== null && (await getCourseCards(filters)).length > 0;

  return (
    <div className="wrap py-12">
      <div className="max-w-2xl">
        <span className="eyebrow">Catalogue</span>
        <h1 className="mt-3 font-display text-[clamp(28px,3.6vw,40px)] font-semibold">
          Tous les cours pour réussir.
        </h1>
        <p className="mt-2 text-[17px] text-muted">
          Filtre par niveau (Tronc commun, 1ère et 2ème bac, Concours), branche ou type
          d&apos;accès.
        </p>
      </div>

      <div className="mt-8">
        <CatalogueFilters />
      </div>

      <p className="mono mt-6 text-[12px] text-muted">
        {courses.length} cours{courses.length > 1 ? "" : ""} trouvé
        {courses.length > 1 ? "s" : ""}
      </p>

      {courses.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Search className="h-6 w-6" />}
          title={blockedByAccess ? "Aucun cours disponible" : "Aucun cours ne correspond"}
          description={
            blockedByAccess
              ? "Ce contenu n'est pas inclus dans ton accès. Contacte ton professeur."
              : "Essaie d'élargir tes filtres pour voir plus de résultats."
          }
        />
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      )}
    </div>
  );
}
