import { edgeAuth } from "@/lib/auth-edge";
import { getAuthRedirectPath } from "@/lib/auth-middleware";
import { NextResponse } from "next/server";

export default edgeAuth((req) => {
  const { pathname } = req.nextUrl;
  const redirectPath = getAuthRedirectPath(
    pathname,
    !!req.auth,
    req.auth?.user?.isAdmin ?? false
  );

  if (redirectPath === "/login") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
