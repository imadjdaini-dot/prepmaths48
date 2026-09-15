import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, Download, ArrowLeft, Lock } from "lucide-react";
import { requireUser, canAccessLesson, canAccessPremiumCourse } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PDFViewer } from "@/components/pdf/pdf-viewer";
import { ButtonLink } from "@/components/ui/button";
import type { SessionUser } from "@/types";

export default async function ResourcePage({
  params,
}: {
  params: { resourceId: string };
}) {
  const user = await requireUser();

  const resource = await prisma.resource.findUnique({
    where: { id: params.resourceId },
    include: {
      lesson: { include: { chapter: { include: { course: true } } } },
      course: true,
    },
  });
  if (!resource || !resource.isPublished) notFound();

  const course = resource.lesson?.chapter.course ?? resource.course;

  let allowed = true;
  if (resource.lesson) {
    allowed = await canAccessLesson(user as SessionUser, {
      isFreePreview: resource.lesson.isFreePreview,
      courseIsPremium: resource.lesson.chapter.course.isPremium,
      courseKind: resource.lesson.chapter.course.kind,
    });
  } else if (resource.course?.isPremium) {
    allowed = await canAccessPremiumCourse(user as SessionUser, resource.course.kind);
  }
  if (!allowed) redirect("/pricing");

  const backHref = course ? `/courses/${course.slug}` : "/courses";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-muted">
        {course && (
          <>
            <Link href={backHref} className="hover:text-ink">
              {course.title}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        )}
        <span className="text-ink">{resource.title}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-semibold">{resource.title}</h1>
          {resource.lesson && (
            <p className="mono mt-1 text-[12px] text-muted">
              Séance : {resource.lesson.title}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <ButtonLink href={backHref} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Retour au cours
          </ButtonLink>
          {resource.allowDownload ? (
            <a
              href={`/api/resources/${resource.id}/file?download=1`}
              className="btn btn-primary btn-sm"
            >
              <Download className="h-4 w-4" /> Télécharger
            </a>
          ) : (
            <span className="pill text-muted">
              <Lock className="h-3.5 w-3.5" /> Téléchargement désactivé
            </span>
          )}
        </div>
      </div>

      <PDFViewer resourceId={resource.id} title={resource.title} />
    </div>
  );
}
