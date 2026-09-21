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

        // Pour les étudiants : vérifier si le compte est actif
        if (user.role !== "ADMIN" && !user.isActive) {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Réactiver l'admin automatiquement s'il est désactivé
        if (user.role === "ADMIN" && !user.isActive) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: true },
          });
        }

        // Gestion de la limite des sessions pour les étudiants
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

        // Création du token de session dans la base
        const generatedSessionToken = crypto.randomBytes(32).toString("hex");
        const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              sessionToken: generatedSessionToken,
              deviceInfo: "Web Browser",
              expires: sessionExpiry,
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
      if (!token?.id) {
        return { ...session, user: undefined };
      }

      // Pour l'ADMIN : accès direct
      if (token.role === "ADMIN") {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as Role;
          (session as { sessionToken?: string }).sessionToken = token.sessionToken as string;
        }
        return session;
      }

      // Pour les ÉLÈVES : Vérifier directement dans la table User si le compte est toujours actif
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true },
        });

        if (!dbUser || !dbUser.isActive) {
          return { ...session, user: undefined };
        }
      } catch (error) {
        console.error("Error checking user status:", error);
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