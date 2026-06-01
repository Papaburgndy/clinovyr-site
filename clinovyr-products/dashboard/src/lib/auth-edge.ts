import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

/** Edge-safe auth config (no email providers / Node adapters). */
export const edgeAuthConfig: NextAuthConfig = {
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.clientId = (token.clientId as string) ?? null;
      }
      return session;
    },
  },
};

export const { auth: edgeAuth } = NextAuth(edgeAuthConfig);
