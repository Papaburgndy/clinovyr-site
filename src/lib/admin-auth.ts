import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-email";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export { getAdminEmail, isAdminEmail } from "@/lib/admin-email";

export function isAdminSession(
  session: { user?: { email?: string | null } } | null,
): boolean {
  return Boolean(session?.user && isAdminEmail(session.user.email));
}

/** Server Components — redirects to login if not admin. */
export async function requireAdmin(redirectTo = "/auth/login") {
  const session = await auth();

  if (!session?.user) {
    redirect(redirectTo);
  }

  if (!isAdminEmail(session.user.email)) {
    redirect(redirectTo);
  }

  return session;
}

/** API routes — returns 401/403 JSON if not admin. */
export async function requireAdminApi() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdminEmail(session.user.email)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, error: null as null };
}
