/**
 * Pure auth redirect rules for dashboard routes (testable without NextAuth).
 */
export function getAuthRedirectPath(
  pathname: string,
  isLoggedIn: boolean,
  isAdmin: boolean
): string | null {
  if (!isLoggedIn) {
    return "/login";
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return "/dashboard";
  }

  return null;
}
