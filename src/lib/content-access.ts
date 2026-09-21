// src/lib/content-access.ts
// مصدر واحد للحقيقة: من يحق له رؤية أي دورة، حسب المستوى (level) والشعبة (track).
//
// القاعدة:
//  - التلميذ يرى دورات مستواه فقط، وبشعبته أو بلا شعبة (track = null ⇒ لكل شعب المستوى).
//  - الحساب الذي فيه concoursAccess = true (يحدده الأدمن) يرى أيضاً محتوى المباريات
//    (level = CONCOURS). هذه السنة: يُفعَّل لتلاميذ 2 باك؛ السنة القادمة: لمن يشترك فقط.
//  - الأدمن يرى كل شيء.
//  - تلميذ بلا مستوى، أو دورة بلا مستوى ⇒ لا شيء (فشل مغلق).
//
// ملاحظة: هذا الملف يحدد "الرؤية" فقط، أما الاشتراك (GRATUIT/COURS/CONCOURS)
// فيبقى محكوماً بمنطق permissions.ts الحالي.

import { cache } from "react";
import type { Level, Prisma, Track } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Audience = {
  role?: string | null;
  level: Level | null;
  track: Track | null;
  // صلاحية إضافية يمنحها الأدمن لكل حساب على حدة
  concoursAccess?: boolean | null;
};

type CourseAudience = { level: Level | null; track: Track | null };

// هذه السنة: محتوى المباريات مدمج في اشتراك "الدورات" للحسابات التي فيها concoursAccess.
// السنة القادمة: غيّرها إلى false ليصبح فتح دروس المباريات مشروطاً باشتراك "المباريات".
export const CONCOURS_BUNDLED_WITH_COURS = true;

/** يقرأ من القاعدة مستوى المستخدم وشعبته وصلاحياته (الجلسة لا تحملها). مخزَّن مؤقتاً لكل طلب. */
export const getAudience = cache(async (userId: string): Promise<Audience | null> => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, level: true, track: true, concoursAccess: true },
  });
});

// شرط لا يطابق أي سجل
const NOTHING = { id: { in: [] as string[] } };

/** فحص فردي: هل يحق لهذا المستخدم رؤية دورة بهذا المستوى/الشعبة؟ */
export function canSeeCourse(user: Audience, course: CourseAudience): boolean {
  if (user.role === "ADMIN") return true;
  if (!user.level || !course.level) return false;

  // 1) محتوى مستواه وشعبته
  if (course.level === user.level) {
    return course.track === null || course.track === user.track;
  }

  // 2) صلاحية المباريات الممنوحة لهذا الحساب
  if (user.concoursAccess && course.level === "CONCOURS") return true;

  return false;
}

/** شرط Prisma للدورات المرئية. ادمجه مع غيره عبر AND: [{ isPublished: true }, courseVisibilityWhere(user)] */
export function courseVisibilityWhere(user: Audience): Prisma.CourseWhereInput {
  if (user.role === "ADMIN") return {};
  if (!user.level) return NOTHING;

  const own: Prisma.CourseWhereInput = {
    level: user.level,
    OR: user.track ? [{ track: null }, { track: user.track }] : [{ track: null }],
  };

  if (user.concoursAccess) {
    return { OR: [own, { level: "CONCOURS" }] };
  }
  return own;
}

/** الدروس المرئية (عبر الفصل ثم الدورة) */
export function lessonVisibilityWhere(user: Audience): Prisma.LessonWhereInput {
  if (user.role === "ADMIN") return {};
  return { chapter: { course: courseVisibilityWhere(user) } };
}

/** الملفات المرئية (مرتبطة بدورة أو بدرس) */
export function resourceVisibilityWhere(user: Audience): Prisma.ResourceWhereInput {
  if (user.role === "ADMIN") return {};
  const course = courseVisibilityWhere(user);
  return { OR: [{ course }, { lesson: { chapter: { course } } }] };
}

/** الاختبارات المرئية (مرتبطة بدورة أو بدرس) */
export function quizVisibilityWhere(user: Audience): Prisma.QuizWhereInput {
  if (user.role === "ADMIN") return {};
  const course = courseVisibilityWhere(user);
  return { OR: [{ course }, { lesson: { chapter: { course } } }] };
}
