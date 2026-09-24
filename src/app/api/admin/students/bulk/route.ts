import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { guardAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { bulkStudentRowSchema, bulkStudentsSchema } from "@/lib/validations";
import { CONCOURS_BUNDLED_WITH_COURS } from "@/lib/content-access";

type Created = { name: string; email: string };
type Skipped = { email: string; reason: string };

/**
 * Import groupé de comptes élèves : même niveau/branche et même mot de passe
 * pour toute la liste. Une ligne invalide ou un email déjà pris est ignoré
 * (listé dans `skipped`) sans interrompre le reste de l'import.
 */
export async function POST(req: Request) {
  const guard = await guardAdmin();
  if (guard.error) return guard.error;

  const parsed = bulkStudentsSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 }
    );
  }

  const { password, level, track, concoursAccess, rows } = parsed.data;

  // Même règle par défaut que la création d'un élève (voir ../route.ts).
  const grantConcours = concoursAccess ?? (CONCOURS_BUNDLED_WITH_COURS && level === "BAC_2");

  // Mot de passe commun : un seul hash pour toute la liste (bcrypt est volontairement lent).
  const passwordHash = await bcrypt.hash(password, 10);

  const created: Created[] = [];
  const skipped: Skipped[] = [];
  const seen = new Set<string>();

  for (const raw of rows) {
    // Lignes vides ignorées silencieusement.
    if (!raw.name.trim() && !raw.email.trim()) continue;

    const row = bulkStudentRowSchema.safeParse(raw);
    if (!row.success) {
      skipped.push({
        email: raw.email.trim() || raw.name.trim(),
        reason: row.error.issues[0]?.message ?? "Ligne invalide",
      });
      continue;
    }
    const { name, email } = row.data;

    if (seen.has(email)) {
      skipped.push({ email, reason: "doublon dans la liste" });
      continue;
    }
    seen.add(email);

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      skipped.push({ email, reason: "existe déjà" });
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "STUDENT",
          isActive: true,
          level: level ?? null,
          track: track ?? null,
          concoursAccess: grantConcours,
        },
      });
      created.push({ name, email });
    } catch {
      // Ex. email créé entre-temps par une autre requête (contrainte unique).
      skipped.push({ email, reason: "création impossible" });
    }
  }

  if (created.length > 0) revalidatePath("/admin/students");
  return NextResponse.json({ created, skipped });
}
