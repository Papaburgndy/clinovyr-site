import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { isAdminEmail } from "@/lib/admin-email";
import { getOnboardingRedirectPath } from "@/lib/onboarding/middleware";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function redirectToLogin(req: Request, pathname: string) {
  const loginUrl = new URL("/auth/login", req.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    const email = req.auth?.user?.email;
    if (!req.auth?.user || !isAdminEmail(email)) {
      return redirectToLogin(req, pathname);
    }
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth?.user;
  const onboardingComplete = req.auth?.user?.onboardingComplete ?? false;

  const redirectPath = getOnboardingRedirectPath(
    pathname,
    isLoggedIn,
    onboardingComplete,
  );

  if (redirectPath === "/auth/login") {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
