import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// أقصى عدد أجهزة مسموح به للتلميذ
const MAX_DEVICES = 2;
// مدة صلاحية الجلسة (30 يوماً) — نفس المدة تُستعمل لتنظيف الجلسات القديمة من BDD
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const emailClean = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: emailClean },
        });

        // DEBUG (مؤقت): احذفه بعد التشخيص
        console.log("[AUTH] email:", emailClean, "| found:", !!user, "| active:", user?.isActive, "| role:", user?.role);

        if (!user) throw new Error("DBG_USER_NOT_FOUND");

        // للطلاب: إذا كان الحساب غير مفعل يرفض الدخول فوراً
        if (user.role !== "ADMIN" && !user.isActive) {
          throw new Error("DBG_ACCOUNT_INACTIVE");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        // DEBUG (مؤقت): احذفه بعد التشخيص
        console.log("[AUTH] password valid:", valid, "| hash prefix:", user.passwordHash?.slice(0, 4));

        if (!valid) {
          const looksLikeBcrypt = /^\$2[aby]\$/.test(user.passwordHash ?? "");
          throw new Error(`DBG_BAD_PASSWORD_bcryptFormat_${looksLikeBcrypt}`);
        }

        // إعادة تفعيل الأدمن تلقائياً إن كان معطلاً
        if (user.role === "ADMIN" && !user.isActive) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
        }

        // ====================================================
        // تطبيق حد الجهازين (2 Devices Max) وتجميد الحساب
        // ====================================================
        let currentSessionToken: string | undefined = undefined;

        if (user.role !== "ADMIN") {
          try {
            // كل العمليات داخل transaction واحدة لتفادي تسجيل دخولين متزامنين
            // يتجاوزان الحد معاً (race condition)
            const newToken = await prisma.$transaction(
              async (tx) => {
                // 1. حذف الجلسات المنتهية الصلاحية حتى لا تُحسب كأجهزة وهمية
                await tx.session.deleteMany({
                  where: {
                    userId: user.id,
                    createdAt: {
                      lt: new Date(Date.now() - SESSION_MAX_AGE * 1000),
                    },
                  },
                });

                const activeCount = await tx.session.count({
                  where: { userId: user.id },
                });

                // 2. وصل للحد الأقصى ويحاول جهاز جديد الدخول → تجميد الحساب
                if (activeCount >= MAX_DEVICES) {
                  // DEBUG (مؤقت): احذفه بعد التشخيص
                  console.log("[AUTH] device limit reached, deactivating user:", user.id, "| sessions:", activeCount);

                  await tx.user.update({
                    where: { id: user.id },
                    data: { isActive: false },
                  });

                  // مسح كل الجلسات → يُطرد الجهازان القديمان أيضاً
                  await tx.session.deleteMany({
                    where: { userId: user.id },
                  });

                  return null; // رفض الدخول (لا نرمي خطأ حتى لا يُلغى التجميد)
                }

                // 3. أقل من الحد → إنشاء sessionToken لهذا الجهاز
                const token = randomUUID();
                await tx.session.create({
                  data: { userId: user.id, sessionToken: token },
                });
                return token;
              },
              // ملاحظة: خيار isolationLevel غير مدعوم في SQLite / MongoDB — احذفه إن كنت تستعملهما
              { isolationLevel: "Serializable" }
            );

            if (!newToken) throw new Error("DBG_DEVICE_LIMIT");
            currentSessionToken = newToken;
          } catch (error) {
            console.error("Error managing student sessions limit:", error);
            // DEBUG (مؤقت): نُظهر رمز خطأ Prisma في الـ Network tab
            if (error instanceof Error && error.message.startsWith("DBG_")) throw error;
            const code = (error as { code?: string }).code ?? "unknown";
            throw new Error(`DBG_SESSION_ERROR_${code}`);
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionToken: currentSessionToken,
        };
      },
    }),
  ],
  events: {
    // عند تسجيل الخروج نحذف جلسة هذا الجهاز من BDD حتى لا يُحسب جهازاً مستهلكاً
    async signOut({ token }) {
      if (token?.sessionToken) {
        try {
          await prisma.session.deleteMany({
            where: { sessionToken: token.sessionToken as string },
          });
        } catch (error) {
          console.error("Error removing session on signOut:", error);
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.sessionToken = (user as { sessionToken?: string }).sessionToken;
      }
      return token;
    },

    async session({ session, token }) {
      if (!token?.id) {
        return { ...session, user: undefined };
      }

      // حسابات الأدمن: استثناء وتجاوز مباشر
      if (token.role === "ADMIN") {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id as string,
            role: token.role as Role,
          },
        };
      }

      // للطلاب: التحقق المزدوج من حالة الحساب ووجود الجلسة الحالية في BDD
      // التلميذ بدون sessionToken (توكن قديم أو معطوب) لا يُقبل أبداً
      if (!token.sessionToken) {
        return { ...session, user: undefined };
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true },
        });

        // 1. إذا تم تعطيل الحساب من الأدمن أو أوتوماتيكياً
        if (!dbUser || !dbUser.isActive) {
          return { ...session, user: undefined };
        }

        // 2. التحقق من أن sessionToken هذا المتصفح ما زال موجوداً في BDD
        const dbSession = await prisma.session.findUnique({
          where: { sessionToken: token.sessionToken as string },
        });

        if (!dbSession) {
          return { ...session, user: undefined };
        }
      } catch (error) {
        console.error("Session verification error:", error);
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}