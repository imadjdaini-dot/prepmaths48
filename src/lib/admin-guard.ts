import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";

/**
 * Garde pour les Route Handlers admin.
 * Retourne soit { user }, soit { error: NextResponse } à renvoyer tel quel.
 */
export async function guardAdmin(): Promise<
  { user: SessionUser; error?: never } | { user?: never; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Accès réservé à l'administrateur" }, { status: 403 }) };
  }
  return { user: session.user as SessionUser };
}
