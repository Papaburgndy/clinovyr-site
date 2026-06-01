import { Resend } from "resend";
import type { ClientConfig, ResendClient } from "../types.js";

export function createResendClient(apiKey?: string): ResendClient | null {
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey) as unknown as ResendClient;
}

export async function sendEscalationEmail(
  resend: ResendClient,
  config: ClientConfig,
  sessionId: string,
  userMessage: string,
  reason: string,
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: config.escalationFrom,
      to: config.escalationEmail,
      subject: `Chat escalation — ${config.businessName}`,
      text: [
        `A website visitor needs human follow-up.`,
        ``,
        `Business: ${config.businessName}`,
        `Session: ${sessionId}`,
        `Reason: ${reason}`,
        ``,
        `Latest message:`,
        userMessage,
      ].join("\n"),
    });
    return true;
  } catch (error) {
    console.error("Failed to send escalation email:", error);
    return false;
  }
}
