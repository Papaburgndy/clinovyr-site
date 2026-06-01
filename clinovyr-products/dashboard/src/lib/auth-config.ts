import Resend from "next-auth/providers/resend";
import Nodemailer from "next-auth/providers/nodemailer";
import type { NextAuthConfig } from "next-auth";

export const emailProviderId = process.env.RESEND_API_KEY ? "resend" : "nodemailer";

function getEmailProvider() {
  if (process.env.RESEND_API_KEY) {
    return Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "Clinovyr Dashboard <onboarding@resend.dev>",
    });
  }

  return Nodemailer({
    server: {
      host: process.env.EMAIL_SERVER_HOST ?? "localhost",
      port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
      auth: process.env.EMAIL_SERVER_USER
        ? {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
          }
        : undefined,
    },
    from: process.env.EMAIL_FROM ?? "dashboard@clinovyr.local",
  });
}

function isAdminEmail(email: string): boolean {
  const admin = process.env.ADMIN_EMAIL ?? "";
  return admin.length > 0 && email.toLowerCase() === admin.toLowerCase();
}

function getProviders() {
  if (process.env.ENABLE_TEST_AUTH === "true") {
    return [];
  }
  return [getEmailProvider()];
}

export const authConfig: NextAuthConfig = {
  providers: getProviders(),
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = isAdminEmail(user.email);
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
  session: { strategy: "jwt" },
  trustHost: true,
};
