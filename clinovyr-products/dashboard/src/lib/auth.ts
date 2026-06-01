import NextAuth from "next-auth";
import { authConfig } from "./auth-config";
import { getClientIdByEmail, isAdminEmail } from "./clients";

export { emailProviderId } from "./auth-config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;
      if (isAdminEmail(user.email)) return true;
      const clientId = await getClientIdByEmail(user.email);
      return clientId !== null;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = isAdminEmail(user.email);
        if (!token.isAdmin) {
          token.clientId = await getClientIdByEmail(user.email);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.clientId = (token.clientId as string) ?? null;
      }
      return session;
    },
  },
});
