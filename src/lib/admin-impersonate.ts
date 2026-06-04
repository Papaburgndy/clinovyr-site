import { getSiteUrl } from "@/lib/stripe";

/**
 * MVP impersonation: link to the client portal with query params documenting
 * admin context. Does not switch the session — admin still sees their own
 * dashboard unless they log in as that user separately.
 *
 * Future: signed impersonation token + middleware to bind session to companyId.
 */
export function getImpersonateDashboardUrl(companyId: string): string {
  const base = getSiteUrl();
  const params = new URLSearchParams({
    adminView: "1",
    refCompanyId: companyId,
  });
  return `${base}/dashboard?${params.toString()}`;
}
