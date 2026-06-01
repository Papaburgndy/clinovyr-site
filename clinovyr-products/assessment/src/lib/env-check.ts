let resendKeyLogged = false;

/** Log partial Resend API key once per process (server startup / first API call). */
export function logResendApiKeyLoaded(): void {
  if (resendKeyLogged) return;
  resendKeyLogged = true;

  const prefix = process.env.RESEND_API_KEY?.slice(0, 8) ?? "(missing)";
  console.log(`[env-check] RESEND_API_KEY loaded: ${prefix}…`);
}
