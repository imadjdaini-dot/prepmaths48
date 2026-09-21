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

        // ====================================================
        // تطبيق حد الجهازين (2 Devices Max) وتجميد الحساب
        // ====================================================
        if (user.role !== "ADMIN") {
          try {
            // 1. حساب عدد الجلسات الحالية للطالب
            const sessionCount = await prisma.session.count({
              where: { userId: user.id },
            });

            // 2. إذا تجاوز أو وصل للحد المسموح (2 أجهزة) وحاول فتح جهاز ثالث
            if (sessionCount >= 2) {
              // تعطيل الحساب أوتوماتيكياً
              await prisma.user.update({
                where: { id: user.id },
                data: { isActive: false },
              });

              // مسح الجلسات القديمة
              await prisma.session.deleteMany({
                where: { userId: user.id },
              });

              // رفض عملية الدخول الثالثة
              return null;
            }

            // 3. إنشآء الجلسة بدون حقل expires
            const tokenString = Math.random().toString(36).substring(2) + Date.now().toString(36);

            await prisma.session.create({
              data: {
                userId: user.id,
                sessionToken: tokenString,
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

      // للطلاب: فحص حالة الحساب في BDD أثناء التصفح
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