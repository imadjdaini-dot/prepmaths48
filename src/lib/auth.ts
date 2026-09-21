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
        // إدارة وتطبيق حد 2 جهازين للتلاميذ فقط
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

            // 2. حساب الجلسات النشطة المتبقية
            const activeSessions = await prisma.session.findMany({
              where: {
                userId: user.id,
                expires: { gt: now },
              },
              orderBy: { expires: "asc" },
            });

            // 3. إذا تجاوز أو وصل للحد المسموح (2 أجهزة)
            if (activeSessions.length >= 2) {
              // خيار أ: إما رفض الدخول الجلسة الجديدة لحين الخروج من أحدهما
              // خيار ب: حذف أقدم جلسة والسماح بالجلسة الجديدة (FIFO)
              // سنعتمد هنا مسح أقدم جلسة لإتاحة تجربة سلسة للتلميذ عند الانتقال لجهاز جديد
              const oldestSession = activeSessions[0];
              await prisma.session.delete({
                where: { id: oldestSession.id },
              });
            }

            // 4. تسجيل الجلسة الجديدة للتلميذ
            sessionToken = crypto.randomBytes(32).toString("hex");
            const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 يوماً

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