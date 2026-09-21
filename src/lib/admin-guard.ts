import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function guardAdmin() {
  const session = await auth();

  // التحقق من أن المستخدم مسجل الدخول وله دور ADMIN
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      ),
    };
  }

  return { user: session.user };
}
