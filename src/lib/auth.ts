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

        // للطلاب فقط: التحقق من أن الحساب نشط
        if (user.role !== "ADMIN" && !user.isActive) {
          console.warn(`Attempt to login to disabled student account: ${user.email}`);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // إذا كان أدمن وكان معطلاً في قاعدة البيانات أونلاين، نعيد تفعيله فوراً
        if (user.role === "ADMIN" && !user.isActive) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
        }

        // تطبيق شرط حد الأجهزة (2 أجهزة) والتجميد على الطلاب فقط وليس الأدمن
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

        // إنشاء sessionToken للجلسة الجديدة
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
          console.error("Error creating session:", error);
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

      // إذا كان المستخدم ADMIN، اسمح له بالمرور مباشرة دون تعقيد الجلسات
      if (token.role === "ADMIN") {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as Role;
          (session as { sessionToken?: string }).sessionToken = token.sessionToken as string;
        }
        return session;
      }

      // بالنسبة للطلاب: التحقق من وجود الجلسة في قاعدة البيانات
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