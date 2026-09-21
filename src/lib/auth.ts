import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

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

        // للتلاميذ: إذا كان الحساب غير نشط يرفض الدخول فوراً
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

        // ====================================================
        // تطبيق المنطق الصارم: تعطيل الحساب عند تجاوز جهازين
        // ====================================================
        if (user.role !== "ADMIN") {
          try {
            const now = new Date();

            // تنظيف الجلسات المنتهية
            await prisma.session.deleteMany({
              where: {
                userId: user.id,
                expires: { lt: now },
              },
            });

            // جلب الجلسات النشطة
            const activeSessions = await prisma.session.findMany({
              where: {
                userId: user.id,
                expires: { gt: now },
              },
            });

            // إذا حاول الدخول وكان لديه بالفعل 2 أجهزة نشطة
            if (activeSessions.length >= 2) {
              // 1. تحويل حالة الحساب إلى غير نشط (Inactif)
              await prisma.user.update({
                where: { id: user.id },
                data: { isActive: false },
              });

              // 2. مسح جميع جلساته المسجلة
              await prisma.session.deleteMany({
                where: { userId: user.id },
              });

              // 3. رفض الدخول
              return null;
            }

            // إذا كان أقل من جهازين، ننشئ كود الجلسة الجديدة
            const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await prisma.session.create({
              data: {
                userId: user.id,
                sessionToken: Math.random().toString(36).substring(2) + Date.now().toString(36),
                deviceInfo: "Web Browser",
                expires: sessionExpiry,
              },
            });

          } catch (error) {
            console.error("Error checking session limits:", error);
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (!token?.id) {
        return { ...session, user: undefined };
      }

      // للطلاب: التأكد من أن الحساب ما زال نشطاً في قاعدة البيانات أثناء التصفح
      if (token.role !== "ADMIN") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isActive: true },
          });

          if (!dbUser || !dbUser.isActive) {
            return { ...session, user: undefined };
          }
        } catch (error) {
          console.error("Session check error:", error);
        }
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