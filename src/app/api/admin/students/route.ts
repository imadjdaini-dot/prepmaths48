import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { createStudentSchema } from "@/lib/validations";
import { CONCOURS_BUNDLED_WITH_COURS } from "@/lib/content-access";

/**
 * Création d'un compte élève.
 * Il n'y a pas d'inscription publique : seul l'administrateur crée les comptes
 * et transmet les identifiants à l'élève.
 */
export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = createStudentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { name, email, password, level, track, concoursAccess } = parsed.data;

  // Cette année, le contenu concours est inclus pour les 2ème bac (voir content-access.ts).
  // L'admin peut forcer true/false ; sinon la valeur par défaut suit le niveau.
  const grantConcours = concoursAccess ?? (CONCOURS_BUNDLED_WITH_COURS && level === "BAC_2");
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "STUDENT",
      isActive: true, // <-- تفعيل حساب الطالب فور إنشائه من الأدمن
      level: level ?? null,
      track: track ?? null,
      concoursAccess: grantConcours,
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ ok: true, id: user.id, email: user.email }, { status: 201 });
}