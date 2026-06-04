import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboardingComplete: boolean;
      hasCompanyProfile: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    onboardingComplete?: boolean;
    hasCompanyProfile?: boolean;
  }
}
