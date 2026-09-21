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

        // للطلاب فقط: التأكد من أن الحساب نشط
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

        // تطبيق حد الجهازين للحسابات غير الأدمن فقط
        if (user.role !== "ADMIN") {
          try {
            const activeSessions = await prisma.session.findMany({
              where: { userId: user.id },
            });

            if (activeSessions.length >= 2) {
              await prisma.user.update({
                where: { id: user.id },
                data: { isActive: false },
              });

              await prisma.session.deleteMany({
                where: { userId: user.id },
              });

              return null;
            }
          } catch (error) {
            console.error("Error checking sessions:", error);
          }
        }

        // إنشاء SessionToken دائم للجميع بما في ذلك الأدمن
        const generatedSessionToken = crypto.randomBytes(32).toString("hex");

        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              sessionToken: generatedSessionToken,
              deviceInfo: "Web Browser",
            },
          });
        } catch (error) {
          console.error("Error creating session in DB:", error);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionToken: generatedSessionToken,
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
      if (!token?.sessionToken) {
        return { ...session, user: undefined };
      }

      // بالنسبة للأدمن: يمر دائماً بسلام إذا كان الـ Token يحتوي على دور ADMIN
      if (token.role === "ADMIN") {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as Role;
          (session as { sessionToken?: string }).sessionToken = token.sessionToken as string;
        }
        return session;
      }

      // للطلاب: التحقق من وجود الجلسة في قاعدة البيانات
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionToken as string },
        include: { user: true },
      });

      if (!dbSession || !dbSession.user.isActive) {
        return { ...session, user: undefined };
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        (session as { sessionToken?: string }).sessionToken = token.sessionToken as string;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}