import type { NextAuthConfig } from "next-auth";

/** Edge-safe auth config shared by middleware (no Prisma / Node adapters). */
export const authConfig = {
  providers: [],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/login",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, trigger, session }) {
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
} satisfies NextAuthConfig;
