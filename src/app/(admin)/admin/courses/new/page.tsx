import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CourseForm } from "@/components/admin/course-form";

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Retour aux cours
      </Link>
      <h1 className="font-display text-[28px] font-semibold">Nouveau cours</h1>
      <CourseForm />
    </div>
  );
}
