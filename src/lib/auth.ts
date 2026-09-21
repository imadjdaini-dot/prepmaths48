import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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

        if (!user) return null;

        // للطلاب فقط: التأكد من أن الحساب مفعل
        if (user.role !== "ADMIN" && !user.isActive) {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // إعادة تفعيل الأدمن تلقائياً إن كان معطلاً
        if (user.role === "ADMIN" && !user.isActive) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
        }

        // ==========================================
        // إدارة حد جهازين (2 Devices Max) للطلاب
        // ==========================================
        let sessionToken: string | undefined = undefined;

        if (user.role !== "ADMIN") {
          try {
            const now = new Date();

            // 1. تنظيف الجلسات المنتهية الصلاحية
            await prisma.session.deleteMany({
              where: {
                userId: user.id,
                expires: { lt: now },
              },
            });

            // 2. جلب الجلسات النشطة
            const activeSessions = await prisma.session.findMany({
              where: {
                userId: user.id,
                expires: { gt: now },
              },
              orderBy: { expires: "asc" },
            });

            // 3. إذا وصل أو تجاوز الحد (جلسة أو أكثر)، نحذف أقدم جلسة لإبقاء مكان للجلسة الجديدة
            if (activeSessions.length >= 2) {
              const oldestSession = activeSessions[0];
              await prisma.session.delete({
                where: { id: oldestSession.id },
              });
            }

            // 4. إنتاج معرف جلسة جديد وتخزينه
            sessionToken = crypto.randomBytes(32).toString("hex");
            const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await prisma.session.create({
              data: {
                userId: user.id,
                sessionToken: sessionToken,
                deviceInfo: "Web Browser",
                expires: sessionExpiry,
              },
            });
          } catch (error) {
            console.error("Error managing student sessions limit:", error);
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionToken,
        };
      },
    }),
  ],
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

      // حسابات الأدمن: استثناء وتجاوز مباشر دون فحص
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

      // حسابات الطلاب: التحقق من وجود sessionToken في قاعدة البيانات
      if (token.sessionToken) {
        try {
          const dbSession = await prisma.session.findUnique({
            where: { sessionToken: token.sessionToken as string },
          });

          // إذا تم مسح الجلسة من BDD بسبب دخول جهاز ثالث، يتم إبطال الجلسة وطرد المتصفح القديم فوراً
          if (!dbSession) {
            return { ...session, user: undefined };
          }
        } catch (error) {
          console.error("Error verifying active session in DB:", error);
        }
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as Role,
        },
        sessionToken: token.sessionToken as string,
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}