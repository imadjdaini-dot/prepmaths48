// مؤقت: ضعه في src/app/api/setup-session-table/route.ts
// يُنشئ جدول Session الناقص في قاعدة الإنتاج، ثم احذف الملف فور نجاحه.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // للأدمن فقط
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // idempotent: يمكن تشغيله أكثر من مرة دون ضرر، ولا يحذف أي بيانات
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "deviceInfo" TEXT,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key"
      ON "Session"("sessionToken")
    `);

    return NextResponse.json({ ok: true, message: "Session table is ready" });
  } catch (error) {
    console.error("setup-session-table failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
