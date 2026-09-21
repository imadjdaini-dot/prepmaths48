import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { updateStudentSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = updateStudentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalide" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  if (
    d.role !== undefined ||
    d.isActive !== undefined ||
    d.level !== undefined ||
    d.concoursAccess !== undefined
  ) {
    await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(d.role !== undefined ? { role: d.role } : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        ...(d.level !== undefined ? { level: d.level, track: d.track ?? null } : {}),
        ...(d.concoursAccess !== undefined ? { concoursAccess: d.concoursAccess } : {}),
      },
    });
  }

  if (d.grantPremium === true) {
    const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000);
    await prisma.subscription.createMany({
      data: (["COURS", "CONCOURS"] as const).map((plan) => ({
        userId: params.id,
        plan,
        status: "ACTIVE" as const,
        paymentProvider: "manual",
        startDate: new Date(),
        endDate: oneYear,
      })),
    });
  } else if (d.grantPremium === false) {
    await prisma.subscription.updateMany({
      where: { userId: params.id, status: "ACTIVE" },
      data: { status: "CANCELLED", endDate: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}

// =======================================================
// Suppression sécurisée avec suppression des dépendances
// =======================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const userId = params.id;

  try {
    // استخدام $transaction لحذف كافة البيانات المرتبطة بالتلميذ أولاً
    await prisma.$transaction([
      // 1. مسح الجلسات والاشتراكات
      prisma.session.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),

      // 2. مسح تقدم الدروس والمحاولات في الاختبارات (إن وجدت في Schema)
      prisma.courseProgress.deleteMany({ where: { userId } }),
      prisma.quizAttempt.deleteMany({ where: { userId } }),

      // 3. أخيراً: حذف كائن التلميذ نفسه
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'élève:", error);

    // محاولة إنقاذ fallback إذا كان هناك نموذج فرعي غير مذكور في الـ Transaction
    try {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ ok: true });
    } catch (fallbackError) {
      console.error("Fallback delete error:", fallbackError);
      return NextResponse.json(
        { error: "Impossible de supprimer cet élève" },
        { status: 500 }
      );
    }
  }
}