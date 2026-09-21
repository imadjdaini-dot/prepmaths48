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

        // للطلاب: إذا كان الحساب غير مفعل يرفض الدخول فوراً
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
        // تطبيق حد الجهازين (2 Devices Max) وتجميد الحساب
        // ====================================================
        let currentSessionToken: string | undefined = undefined;

        if (user.role !== "ADMIN") {
          try {
            const activeSessions = await prisma.session.findMany({
              where: { userId: user.id },
            });

            // إذا حاول الدخول وكان لديه 2 أجهزة أو أكثر
            if (activeSessions.length >= 2) {
              // 1. تعطيل الحساب أوتوماتيكياً
              await prisma.user.update({
                where: { id: user.id },
                data: { isActive: false },
              });

              // 2. مسح جميع الجلسات المسجلة من BDD
              await prisma.session.deleteMany({
                where: { userId: user.id },
              });

              // 3. طرد المتصفح الثالث ومنع الدخول
              return null;
            }

            // إذا كان أقل من 2، ننشئ sessionToken خاص بهذا المتصفح ونخزنه
            currentSessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

            await prisma.session.create({
              data: {
                userId: user.id,
                sessionToken: currentSessionToken,
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
          sessionToken: currentSessionToken,
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
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true },
        });

        // 1. إذا تم تعطيل الحساب من الأدمن أو أوتوماتيكياً
        if (!dbUser || !dbUser.isActive) {
          return { ...session, user: undefined };
        }

        // 2. التحقق من أن sessionToken هذا المتصفح ما زال موجوداً في BDD ولم يُحذف
        if (token.sessionToken) {
          const dbSession = await prisma.session.findUnique({
            where: { sessionToken: token.sessionToken as string },
          });

          // إذا حُذفت الجلسة، يتم إبطال الـ Session فوراً وطرد المتصفح القديم
          if (!dbSession) {
            return { ...session, user: undefined };
          }
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