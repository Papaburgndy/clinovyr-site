/**
 * Pure onboarding redirect rules (testable without NextAuth).
 */
export function getOnboardingRedirectPath(
  pathname: string,
  isLoggedIn: boolean,
  onboardingComplete: boolean,
): string | null {
  const isOnboarding = pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!isOnboarding && !isDashboard) {
    return null;
  }

  if (!isLoggedIn) {
    return "/auth/login";
  }

  if (isDashboard && !onboardingComplete) {
    return "/onboarding";
  }

  if (isOnboarding && onboardingComplete) {
    return "/dashboard";
  }

  return null;
}
