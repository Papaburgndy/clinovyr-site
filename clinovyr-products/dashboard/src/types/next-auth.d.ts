import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      isAdmin: boolean;
      clientId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email?: string;
    isAdmin?: boolean;
    clientId?: string | null;
  }
}
