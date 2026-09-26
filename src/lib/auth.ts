// src/lib/auth.ts
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { MAX_DEVICES, describeDevice } from "@/lib/device";
import type { Role } from "@prisma/client";

// مدة صلاحية الجلسة (30 يوماً) — نفس المدة تُستعمل لتنظيف الجلسات القديمة من BDD
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// hash وهمي: نقارن به حين لا يوجد المستخدم حتى لا يختلف زمن الاستجابة
// (فلا يُعرف من التوقيت إن كان الإيميل مسجلاً أم لا)
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

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
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const emailClean = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: emailClean },
        });

        if (!user) {
          await bcrypt.compare(credentials.password, DUMMY_HASH);
          return null; // رسالة عامة: "Email ou mot de passe incorrect"
        }

        // نتحقق من كلمة المرور أولاً: سبب التعليق يُكشف لصاحب الحساب فقط
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // الأدمن: إعادة تفعيل تلقائية إن كان معطلاً
        if (user.role === "ADMIN" && !user.isActive) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
        }

        // التلميذ: حساب معطل (من الأدمن أو تلقائياً) → رسالة "حساب معلّق"
        if (user.role !== "ADMIN" && !user.isActive) {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        // ====================================================
        // تطبيق حد الجهازين وتجميد الحساب
        // ====================================================
        let currentSessionToken: string | undefined = undefined;

        if (user.role !== "ADMIN") {
          const uaHeader = req?.headers?.["user-agent"];
          const userAgent = typeof uaHeader === "string" ? uaHeader : undefined;
          // بصمة الجهاز: hash للـ User-Agent الخام (وليس describeDevice الذي قد يدمج جهازين مختلفين)
          // بدون User-Agent لا نستطيع التعرف على الجهاز → يُحسب جهازاً جديداً
          const userAgentHash = userAgent
            ? createHash("sha256").update(userAgent).digest("hex")
            : null;

          let newToken: string | null = null;

          try {
            // كل العمليات داخل transaction واحدة لتفادي تسجيل دخولين متزامنين
            newToken = await prisma.$transaction(
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

                // 2. نفس الجهاز (نفس User-Agent) سبق له الدخول → نجدد جلسته بدل حسابه جهازاً جديداً
                //    (التوكن القديم لهذا الجهاز يصبح غير صالح)
                if (userAgentHash) {
                  const token = randomUUID();
                  const { count } = await tx.session.updateMany({
                    where: { userId: user.id, userAgentHash },
                    data: {
                      sessionToken: token,
                      createdAt: new Date(),
                      deviceInfo: describeDevice(userAgent),
                    },
                  });
                  if (count > 0) return token;
                }

                const activeCount = await tx.session.count({
                  where: { userId: user.id },
                });

                // 3. وصل للحد الأقصى ويحاول جهاز جديد الدخول → تجميد الحساب
                if (activeCount >= MAX_DEVICES) {
                  await tx.user.update({
                    where: { id: user.id },
                    data: { isActive: false },
                  });

                  // مسح كل الجلسات → يُطرد الجهازان القديمان أيضاً
                  await tx.session.deleteMany({
                    where: { userId: user.id },
                  });

                  return null; // لا نرمي خطأ هنا حتى لا يُلغى التجميد
                }

                // 4. أقل من الحد → إنشاء جلسة لهذا الجهاز مع وصفه وبصمته
                const token = randomUUID();
                await tx.session.create({
                  data: {
                    userId: user.id,
                    sessionToken: token,
                    deviceInfo: describeDevice(userAgent),
                    userAgentHash,
                  },
                });
                return token;
              },
              // ملاحظة: خيار isolationLevel غير مدعوم في SQLite / MongoDB — احذفه إن كنت تستعملهما
              { isolationLevel: "Serializable" }
            );
          } catch (error) {
            console.error("Error managing student sessions limit:", error);
            // Fail closed: عند أي خطأ في القاعدة لا نسمح بالدخول
            return null;
          }

          // تجاوز حد الأجهزة → رسالة خاصة (الحساب جُمّد داخل الـ transaction)
          if (!newToken) {
            throw new Error("DEVICE_LIMIT");
          }
          currentSessionToken = newToken;
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
        //    (يُحذف عند "إخراج جهاز" من صفحة أجهزتي، أو عند تجاوز الحد)
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
