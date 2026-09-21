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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // إذا كان المستخدم غير موجود أو حسابه معطل
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // تطبيق شرط حد الأجهزة (2 أجهزة) والتجميد على الطلاب فقط وليس الأدمن
        if (user.role !== "ADMIN") {
          try {
            const activeSessions = await prisma.session.findMany({
              where: { userId: user.id },
            });

            if (activeSessions.length >= 2) {
              // 1. تعطيل حساب الطالب
              await prisma.user.update({
                where: { id: user.id },
                data: { isActive: false },
              });

              // 2. حذف كل جلساته
              await prisma.session.deleteMany({
                where: { userId: user.id },
              });

              console.warn(`تم تعطيل حساب الطالب ${user.email} لتجاوزه الحد الأقصى للأجهزة.`);
              return null;
            }
          } catch (error) {
            console.error("خطأ أثناء التحقق من عدد الأجهزة المسموحة:", error);
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
          console.error("خطأ أثناء إنشاء الجلسة في قاعدة البيانات:", error);
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

      // التحقق من وجود الجلسة في قاعدة البيانات
      const dbSession = await prisma.session.findUnique({
        where: { sessionToken: token.sessionToken as string },
        include: { user: true },
      });

      // إذا كانت الجلسة حذفها أو الحساب أصبح معطلاً
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