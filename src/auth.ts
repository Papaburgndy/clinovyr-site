import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Adapter } from "next-auth/adapters";
import { authConfig } from "@/auth.config";
import { getCompanySessionFlags } from "@/lib/onboarding/company-session";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) {
          return null;
        }

        if (!user.emailVerified) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
      }

      const userId = (token.id as string | undefined) ?? token.sub;
      if (
        userId &&
        (user?.id || trigger === "signIn" || trigger === "signUp")
      ) {
        const flags = await getCompanySessionFlags(userId);
        token.onboardingComplete = flags.onboardingComplete;
        token.hasCompanyProfile = flags.hasCompanyProfile;
      }

      if (trigger === "update" && session) {
        const update = session as {
          onboardingComplete?: boolean;
          hasCompanyProfile?: boolean;
        };
        if (typeof update.onboardingComplete === "boolean") {
          token.onboardingComplete = update.onboardingComplete;
        }
        if (typeof update.hasCompanyProfile === "boolean") {
          token.hasCompanyProfile = update.hasCompanyProfile;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        } else if (token.sub) {
          session.user.id = token.sub;
        }
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
        session.user.hasCompanyProfile = Boolean(token.hasCompanyProfile);
      }
      return session;
    },
  },
});
