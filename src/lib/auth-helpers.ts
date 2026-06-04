import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth(redirectTo = "/auth/login") {
  const session = await auth();

  if (!session?.user) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireAuthApi() {
  const session = await auth();

  if (!session?.user?.id) {
    return { session: null, userId: null as null };
  }

  return { session, userId: session.user.id };
}

export async function getOptionalSession() {
  return auth();
}
