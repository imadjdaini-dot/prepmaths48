import type { Metadata } from "next";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/courses/course-card";
import { CatalogueFilters } from "@/components/courses/catalogue-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { getCourseCards } from "@/lib/queries";

export const metadata: Metadata = { title: "Catalogue — Prép-Maths48" };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { track?: string; kind?: string; level?: string; premium?: string };
}) {
  const courses = await getCourseCards({
    track: searchParams.track,
    kind: searchParams.kind,
    level: searchParams.level,
    premium: searchParams.premium as "free" | "premium" | undefined,
  });

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
          title="Aucun cours ne correspond"
          description="Essaie d'élargir tes filtres pour voir plus de résultats."
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
