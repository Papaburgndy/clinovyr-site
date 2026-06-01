import fs from "fs";
import os from "os";
import path from "path";
import type Stripe from "stripe";
import {
  isSessionProcessed,
  markSessionProcessed,
  readProcessedPayments,
} from "@/lib/processed-payments";
import { processCheckoutSessionCompleted } from "@/lib/webhook-handler";

function tempStorePath(): string {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "playbook-webhook-")),
    "processed-payments.json",
  );
}

function mockSession(id: string, email: string): Stripe.Checkout.Session {
  return {
    id,
    customer_details: { email },
    metadata: { industry: "medical", version: "1" },
  } as Stripe.Checkout.Session;
}

describe("processed-payments store", () => {
  it("persists and detects processed session ids", () => {
    const storePath = tempStorePath();
    expect(isSessionProcessed("cs_test_1", storePath)).toBe(false);

    markSessionProcessed(
      {
        sessionId: "cs_test_1",
        processedAt: new Date().toISOString(),
      },
      storePath,
    );

    expect(isSessionProcessed("cs_test_1", storePath)).toBe(true);
    const store = readProcessedPayments(storePath);
    expect(store.sessions.cs_test_1?.sessionId).toBe("cs_test_1");
  });
});

describe("processCheckoutSessionCompleted", () => {
  it("sends email once and skips duplicate session deliveries", async () => {
    const storePath = tempStorePath();
    const sendEmail = jest.fn().mockResolvedValue({ ok: true });
    const session = mockSession("cs_dup_test", "buyer@example.com");

    const first = await processCheckoutSessionCompleted(
      session,
      "evt_1",
      { sendEmail, storePath },
      {
        industrySlug: "medical",
        version: 1,
        industryLabel: "Medical & Dental",
        playbookTitle: "Test Playbook",
        downloadUrl: "http://localhost/api/playbook-download?session_id=cs_dup_test",
      },
    );

    expect(first.emailSent).toBe(true);
    expect(first.skippedDuplicate).toBe(false);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const second = await processCheckoutSessionCompleted(
      session,
      "evt_2",
      { sendEmail, storePath },
      {
        industrySlug: "medical",
        version: 1,
        industryLabel: "Medical & Dental",
        playbookTitle: "Test Playbook",
        downloadUrl: "http://localhost/api/playbook-download?session_id=cs_dup_test",
      },
    );

    expect(second.skippedDuplicate).toBe(true);
    expect(second.emailSent).toBe(false);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});
